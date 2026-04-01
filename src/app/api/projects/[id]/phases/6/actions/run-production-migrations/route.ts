import { createClient } from '@/lib/supabase/server'
import { executeSqlOnProject, validateSqlSafety } from '@/lib/supabase/management-api'
import { fetchDirectoryListing, fetchMultipleFiles } from '@/lib/github/file-content'
import { checkPrerequisites } from '@/lib/actions/prerequisites'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { getActionByName } from '@/lib/actions/action-registry'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('run-production-migrations')!
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

    // Parse body
    const body = await request.json().catch(() => ({}))
    const { confirm } = body as { confirm?: boolean }

    // 5. Fetch migration files from repo
    if (!project.repo_url) {
      return Response.json(
        { error: 'no_repo', message: 'El proyecto no tiene repositorio GitHub conectado.' },
        { status: 400 },
      )
    }

    const migrationPaths = await fetchDirectoryListing(project.repo_url, 'infrastructure/supabase/migrations')
    const sqlPaths = migrationPaths.filter((f) => f.endsWith('.sql')).sort()

    if (sqlPaths.length === 0) {
      return Response.json(
        { error: 'no_migrations', message: 'No se encontraron archivos de migracion en el repositorio.' },
        { status: 400 },
      )
    }

    const migrationContents = await fetchMultipleFiles(project.repo_url, sqlPaths)
    const combinedSql = sqlPaths
      .map((path) => `-- Migration: ${path}\n${migrationContents[path] ?? ''}`)
      .filter((s) => s.trim().length > 20)
      .join('\n\n')

    if (!combinedSql.trim()) {
      return Response.json(
        { error: 'empty_migrations', message: 'Los archivos de migracion estan vacios.' },
        { status: 400 },
      )
    }

    // If not confirmed, return SQL for preview
    if (!confirm) {
      return Response.json({
        preview: true,
        sql: combinedSql,
        migrationFiles: sqlPaths,
      })
    }

    // 6. Record action start (only when confirming execution)
    executionId = await recordActionStart(
      projectId,
      actionDef.phaseNumber,
      actionDef.section,
      actionDef.itemIndices[0],
      actionDef.actionName,
    )

    // 7. Validate SQL safety
    const safety = validateSqlSafety(combinedSql)
    if (!safety.safe) {
      await recordActionComplete(executionId, 'failed', undefined, undefined, safety.reason)
      return Response.json(
        { error: 'blocked', message: safety.reason },
        { status: 400 },
      )
    }

    // 8. Execute SQL on production Supabase
    const sqlResult = await executeSqlOnProject(
      project.supabase_project_ref!,
      project.supabase_access_token!,
      combinedSql,
    )

    if (!sqlResult.success) {
      await recordActionComplete(executionId, 'failed', undefined, undefined, sqlResult.error)
      return Response.json(
        { error: 'execution_failed', message: sqlResult.error },
        { status: 400 },
      )
    }

    // 9. Auto-check deploy_production items
    await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

    // 10. Record action complete
    await recordActionComplete(
      executionId,
      'success',
      `Production migrations executed successfully (${sqlResult.rowCount} rows)`,
      {
        sqlExecuted: true,
        rowCount: sqlResult.rowCount,
        migrationFiles: sqlPaths,
      },
    )

    return Response.json({
      success: true,
      sqlExecuted: true,
      rowCount: sqlResult.rowCount,
      migrationFiles: sqlPaths,
    })
  } catch (error) {
    console.error('[run-production-migrations] Error:', error)
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
