import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, DEFAULT_MODEL_ID, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext } from '@/lib/ai/context-builder'
import { extractCodeFiles } from '@/lib/ai/code-extractor'
import { commitMultipleFiles } from '@/lib/github/commit'
import { fetchDirectoryListing, fetchMultipleFiles } from '@/lib/github/file-content'
import { checkPrerequisites } from '@/lib/actions/prerequisites'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { recordStreamUsage } from '@/lib/ai/usage'
import { getActionByName } from '@/lib/actions/action-registry'
import { generateUnitTestsPrompt } from '@/lib/ai/prompts/action-prompts'
import { checkHeavyQuota } from '@/lib/plans/quota'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('generate-unit-tests')!
  let executionId = ''

  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Quota check — block heavy AI ops if budget exceeded
    const quotaBlock = await checkHeavyQuota(user.id)
    if (quotaBlock) return quotaBlock

    // 2. Verify project belongs to user
    const { data: project } = await supabase
      .from('projects')
      .select('id, repo_url, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json(
        { error: 'not_found', message: 'Proyecto no encontrado.' },
        { status: 404 },
      )
    }

    // 3. Check prerequisites
    const prereqResult = await checkPrerequisites(projectId, actionDef.prerequisites)
    if (!prereqResult.met) {
      return Response.json(
        { error: 'prerequisites_not_met', missing: prereqResult.missing },
        { status: 400 },
      )
    }

    // 4. Rate limit
    const ip = getClientIp(request)
    const rateLimitKey = `action:${user.id}:${ip}`
    const rateResult = checkRateLimit(rateLimitKey, ACTION_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json(
        { error: 'rate_limited', message: 'Limite de acciones por hora alcanzado. Intenta mas tarde.' },
        { status: 429 },
      )
    }

    // 5. Record action start
    executionId = await recordActionStart(
      projectId,
      actionDef.phaseNumber,
      actionDef.section,
      actionDef.itemIndices[0],
      actionDef.actionName,
    )

    // 6. Fetch source files from repo for context
    const [libFiles, utilsFiles] = await Promise.all([
      fetchDirectoryListing(project.repo_url!, 'src/lib'),
      fetchDirectoryListing(project.repo_url!, 'src/utils'),
    ])

    const allSourcePaths = [...libFiles, ...utilsFiles]
      .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
      .slice(0, 20) // Cap to avoid excessive API calls

    const sourceFileContents = await fetchMultipleFiles(project.repo_url!, allSourcePaths)

    const sourceFilesContext = Object.entries(sourceFileContents)
      .map(([path, content]) => `### ${path}\n\`\`\`typescript\n${content}\n\`\`\``)
      .join('\n\n')

    // 7. Build full project context
    const context = await buildFullProjectContext(projectId)

    // 8. Build prompt
    const systemPrompt = generateUnitTestsPrompt({
      projectName: context.name,
      sourceFiles: sourceFilesContext || 'No source files found in src/lib/ or src/utils/.',
      repoContext: context.repoContext,
    })

    // 9. Stream AI generation
    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: 'Generate comprehensive Vitest unit tests for the source code.',
        },
      ],
      ...AI_CONFIG.documentGeneration,
      onFinish: async ({ text, usage }) => {
        await recordStreamUsage({ userId: user.id, projectId, eventType: 'action_generate_unit_tests', model: DEFAULT_MODEL_ID, usage })
        try {
          // 10. Extract test files from AI output
          const extractedFiles = extractCodeFiles(text)

          if (extractedFiles.length === 0) {
            await recordActionComplete(executionId, 'failed', undefined, undefined, 'No files extracted from AI output')
            return
          }

          // 11. Commit test files to GitHub
          const filesToCommit = extractedFiles.map((f) => ({
            path: f.path,
            content: f.content,
          }))

          const commitResult = await commitMultipleFiles(
            project.repo_url!,
            filesToCommit,
            'test: add unit tests (Tribux Phase 05)',
          )

          // 12. Auto-check unit_tests items
          await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

          // 13. Record action complete
          await recordActionComplete(
            executionId,
            'success',
            `Committed ${commitResult.filesChanged} test files`,
            {
              files: extractedFiles.map((f) => f.path),
              commit: { sha: commitResult.sha, url: commitResult.url },
            },
          )
        } catch (error) {
          console.error('[generate-unit-tests] Post-stream error:', error)
          const message = error instanceof Error ? error.message : 'Error desconocido'
          await recordActionComplete(executionId, 'failed', undefined, undefined, message)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[generate-unit-tests] Error:', error)
    if (executionId) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      await recordActionComplete(executionId, 'failed', undefined, undefined, message)
    }
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: 'action_failed', message },
      { status: 500 },
    )
  }
}
