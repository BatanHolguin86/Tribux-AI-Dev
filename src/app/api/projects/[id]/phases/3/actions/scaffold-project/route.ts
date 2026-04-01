import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext } from '@/lib/ai/context-builder'
import { extractCodeFiles } from '@/lib/ai/code-extractor'
import { commitMultipleFiles } from '@/lib/github/commit'
import { checkPrerequisites } from '@/lib/actions/prerequisites'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { getActionByName } from '@/lib/actions/action-registry'
import { scaffoldProjectPrompt } from '@/lib/ai/prompts/action-prompts'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('scaffold-project')!
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

    // 6. Build full project context
    const context = await buildFullProjectContext(projectId)

    // 7. Build prompt
    const systemPrompt = scaffoldProjectPrompt({
      projectName: context.name,
      description: context.description,
      industry: context.industry,
      discoveryDocs: context.discoveryDocs,
      featureSpecs: context.featureSpecs,
      artifacts: context.artifacts,
    })

    // 8. Stream AI generation
    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: 'Generate the initial project scaffold with all configuration and base files.',
        },
      ],
      ...AI_CONFIG.documentGeneration,
      onFinish: async ({ text }) => {
        try {
          // 9. Extract files from AI output
          const extractedFiles = extractCodeFiles(text)

          if (extractedFiles.length === 0) {
            await recordActionComplete(executionId, 'failed', undefined, undefined, 'No files extracted from AI output')
            return
          }

          // 10. Commit files to GitHub
          const filesToCommit = extractedFiles.map((f) => ({
            path: f.path,
            content: f.content,
          }))

          const commitResult = await commitMultipleFiles(
            project.repo_url!,
            filesToCommit,
            `chore: scaffold project structure (AI Squad Phase 03)`,
          )

          // 11. Auto-check repository items
          await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

          // 12. Record action complete
          await recordActionComplete(
            executionId,
            'success',
            `Committed ${commitResult.filesChanged} files`,
            {
              files: extractedFiles.map((f) => f.path),
              commit: { sha: commitResult.sha, url: commitResult.url },
            },
          )
        } catch (error) {
          console.error('[scaffold-project] Post-stream error:', error)
          const message = error instanceof Error ? error.message : 'Error desconocido'
          await recordActionComplete(executionId, 'failed', undefined, undefined, message)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[scaffold-project] Error:', error)
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
