import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, DEFAULT_MODEL_ID, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext } from '@/lib/ai/context-builder'
import { extractCodeFiles } from '@/lib/ai/code-extractor'
import { commitMultipleFiles } from '@/lib/github/commit'
import { executeSqlOnProject, validateSqlSafety } from '@/lib/supabase/management-api'
import { checkPrerequisites } from '@/lib/actions/prerequisites'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { recordStreamUsage } from '@/lib/ai/usage'
import { getActionByName } from '@/lib/actions/action-registry'
import { applyDatabaseSchemaPrompt } from '@/lib/ai/prompts/action-prompts'
import { checkHeavyQuota } from '@/lib/plans/quota'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('apply-database-schema')!
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

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { confirm, sql: providedSql, commitToRepo } = body as {
      confirm?: boolean
      sql?: string
      commitToRepo?: boolean
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

    // If confirm + sql provided, skip AI generation and execute directly
    if (confirm && providedSql) {
      // Safety check
      const safety = validateSqlSafety(providedSql)
      if (!safety.safe) {
        await recordActionComplete(executionId, 'failed', undefined, undefined, safety.reason)
        return Response.json(
          { error: 'blocked', message: safety.reason },
          { status: 400 },
        )
      }

      // Execute SQL
      const sqlResult = await executeSqlOnProject(
        project.supabase_project_ref!,
        project.supabase_access_token!,
        providedSql,
      )

      if (!sqlResult.success) {
        await recordActionComplete(executionId, 'failed', undefined, undefined, sqlResult.error)
        return Response.json(
          { error: 'execution_failed', message: sqlResult.error },
          { status: 400 },
        )
      }

      // Optionally commit migration file to repo
      let commitData = null
      if (commitToRepo && project.repo_url) {
        try {
          const commitResult = await commitMultipleFiles(
            project.repo_url,
            [{ path: 'infrastructure/supabase/migrations/001_initial_schema.sql', content: providedSql }],
            'chore: add initial database schema migration (Tribux AI Phase 03)',
          )
          commitData = { sha: commitResult.sha, url: commitResult.url }
        } catch (commitError) {
          console.error('[apply-database-schema] Commit error (non-fatal):', commitError)
        }
      }

      // Auto-check database items
      await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

      // Record completion
      await recordActionComplete(
        executionId,
        'success',
        `SQL executed successfully (${sqlResult.rowCount} rows)`,
        { sqlExecuted: true, rowCount: sqlResult.rowCount, commit: commitData },
      )

      return Response.json({
        success: true,
        sqlExecuted: true,
        rowCount: sqlResult.rowCount,
        commit: commitData,
      })
    }

    // 6. Build context
    const context = await buildFullProjectContext(projectId)

    // 7. Build prompt and stream AI generation
    const systemPrompt = applyDatabaseSchemaPrompt({
      projectName: context.name,
      discoveryDocs: context.discoveryDocs,
      featureSpecs: context.featureSpecs,
      artifacts: context.artifacts,
    })

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: 'Generate the complete database schema SQL migration based on the architecture.',
        },
      ],
      ...AI_CONFIG.documentGeneration,
      onFinish: async ({ text, usage }) => {
        await recordStreamUsage({ userId: user.id, projectId, eventType: 'action_apply_db_schema', model: DEFAULT_MODEL_ID, usage })
        try {
          // 8. Extract SQL from AI output
          const extractedFiles = extractCodeFiles(text)
          const sqlFiles = extractedFiles.filter((f) => f.language === 'sql' || f.path.endsWith('.sql'))
          const sql = sqlFiles.map((f) => f.content).join('\n\n')

          if (!sql) {
            await recordActionComplete(executionId, 'success', 'SQL generated (awaiting confirmation)', {
              files: extractedFiles.map((f) => f.path),
              requiresConfirmation: true,
            })
            return
          }

          // Record as pending confirmation — SQL will be executed when user confirms
          await recordActionComplete(
            executionId,
            'success',
            'SQL schema generated — awaiting user confirmation to execute',
            {
              files: extractedFiles.map((f) => f.path),
              sql,
              requiresConfirmation: true,
            },
          )
        } catch (error) {
          console.error('[apply-database-schema] Post-stream error:', error)
          const message = error instanceof Error ? error.message : 'Error desconocido'
          await recordActionComplete(executionId, 'failed', undefined, undefined, message)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[apply-database-schema] Error:', error)
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
