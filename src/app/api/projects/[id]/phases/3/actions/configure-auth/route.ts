import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext } from '@/lib/ai/context-builder'
import { extractCodeFiles } from '@/lib/ai/code-extractor'
import { commitMultipleFiles } from '@/lib/github/commit'
import { executeSqlOnProject, validateSqlSafety } from '@/lib/supabase/management-api'
import { checkPrerequisites } from '@/lib/actions/prerequisites'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { getActionByName } from '@/lib/actions/action-registry'
import { configureAuthPrompt } from '@/lib/ai/prompts/action-prompts'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('configure-auth')!
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
      .select('id, repo_url, user_id, supabase_project_ref, supabase_access_token')
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

    // 6. Build context
    const context = await buildFullProjectContext(projectId)

    // 7. Build prompt and stream AI generation
    const systemPrompt = configureAuthPrompt({
      projectName: context.name,
      discoveryDocs: context.discoveryDocs,
      featureSpecs: context.featureSpecs,
    })

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: 'Generate the RLS policies, auth helpers, and middleware configuration.',
        },
      ],
      ...AI_CONFIG.documentGeneration,
      onFinish: async ({ text }) => {
        try {
          // 8. Extract files (SQL + code)
          const extractedFiles = extractCodeFiles(text)

          if (extractedFiles.length === 0) {
            await recordActionComplete(executionId, 'failed', undefined, undefined, 'No files extracted from AI output')
            return
          }

          const sqlFiles = extractedFiles.filter((f) => f.language === 'sql' || f.path.endsWith('.sql'))
          const codeFiles = extractedFiles.filter((f) => f.language !== 'sql' && !f.path.endsWith('.sql'))

          const results: Record<string, unknown> = {
            files: extractedFiles.map((f) => f.path),
          }

          // 9. Execute SQL files on Supabase
          if (sqlFiles.length > 0 && project.supabase_project_ref && project.supabase_access_token) {
            const combinedSql = sqlFiles.map((f) => f.content).join('\n\n')

            const safety = validateSqlSafety(combinedSql)
            if (safety.safe) {
              const sqlResult = await executeSqlOnProject(
                project.supabase_project_ref,
                project.supabase_access_token,
                combinedSql,
              )
              results.sqlExecuted = sqlResult.success
              results.sqlRowCount = sqlResult.rowCount
              if (!sqlResult.success) {
                results.sqlError = sqlResult.error
              }
            } else {
              results.sqlBlocked = true
              results.sqlBlockReason = safety.reason
            }
          }

          // 10. Commit code files (and SQL files) to GitHub
          if (project.repo_url) {
            const filesToCommit = extractedFiles.map((f) => ({
              path: f.path,
              content: f.content,
            }))

            if (filesToCommit.length > 0) {
              try {
                const commitResult = await commitMultipleFiles(
                  project.repo_url,
                  filesToCommit,
                  'feat: configure authentication — RLS policies & auth helpers (AI Squad Phase 03)',
                )
                results.commit = { sha: commitResult.sha, url: commitResult.url }
              } catch (commitError) {
                console.error('[configure-auth] Commit error:', commitError)
                results.commitError = commitError instanceof Error ? commitError.message : 'Commit failed'
              }
            }
          }

          // 11. Auto-check authentication items
          await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

          // 12. Record completion
          const summaryParts: string[] = []
          if (sqlFiles.length > 0) summaryParts.push(`${sqlFiles.length} SQL file(s) executed`)
          if (codeFiles.length > 0) summaryParts.push(`${codeFiles.length} code file(s) committed`)

          await recordActionComplete(
            executionId,
            'success',
            summaryParts.join(', ') || 'Auth configured',
            results,
          )
        } catch (error) {
          console.error('[configure-auth] Post-stream error:', error)
          const message = error instanceof Error ? error.message : 'Error desconocido'
          await recordActionComplete(executionId, 'failed', undefined, undefined, message)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[configure-auth] Error:', error)
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
