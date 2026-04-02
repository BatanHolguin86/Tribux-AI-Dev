import { createClient } from '@/lib/supabase/server'
import { getRollbackTarget, createRollbackRelease } from '@/lib/github/workflows'
import { getActionByName } from '@/lib/actions/action-registry'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 30

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actionDef = getActionByName('rollback-deploy')!
  let executionId = ''

  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: project } = await supabase
      .from('projects')
      .select('id, repo_url, name, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    if (!project.repo_url) {
      return Response.json(
        { error: 'no_repo', message: 'El proyecto no tiene repositorio GitHub conectado.' },
        { status: 400 },
      )
    }

    // Rate limit
    const ip = getClientIp(request)
    const rateResult = checkRateLimit(`action:${user.id}:${ip}`, ACTION_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json(
        { error: 'rate_limited', message: 'Limite de acciones alcanzado. Intenta mas tarde.' },
        { status: 429 },
      )
    }

    // Record action start
    executionId = await recordActionStart(
      projectId,
      actionDef.phaseNumber,
      actionDef.section,
      actionDef.itemIndices[0] ?? 0,
      actionDef.actionName,
    )

    // Get the previous release as rollback target
    const rollbackTarget = await getRollbackTarget(project.repo_url)

    if (!rollbackTarget) {
      await recordActionComplete(
        executionId,
        'failed',
        undefined,
        undefined,
        'No se encontro una version anterior para hacer rollback. Se necesitan al menos 2 releases.',
      )
      return Response.json(
        { error: 'no_rollback_target', message: 'No hay version anterior. Se necesitan al menos 2 releases para hacer rollback.' },
        { status: 400 },
      )
    }

    // Create rollback release
    const result = await createRollbackRelease(
      project.repo_url,
      rollbackTarget.commitSha,
      rollbackTarget.tag,
    )

    if (!result.success) {
      await recordActionComplete(executionId, 'failed', undefined, undefined, result.error)
      return Response.json(
        { error: 'rollback_failed', message: result.error ?? 'Error al crear release de rollback.' },
        { status: 500 },
      )
    }

    await recordActionComplete(executionId, 'success', `Rollback a ${rollbackTarget.tag}`, {
      tagName: result.tagName,
      rollbackTo: rollbackTarget.tag,
      targetCommit: rollbackTarget.commitSha,
      releaseUrl: result.html_url,
    })

    return Response.json({
      success: true,
      tagName: result.tagName,
      rollbackTo: rollbackTarget.tag,
      targetCommit: rollbackTarget.commitSha,
      html_url: result.html_url,
      message: `Rollback a ${rollbackTarget.tag} creado. Vercel redeploy en progreso.`,
    })
  } catch (error) {
    console.error('[rollback-deploy] Error:', error)
    if (executionId) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      await recordActionComplete(executionId, 'failed', undefined, undefined, message)
    }
    return Response.json(
      { error: 'action_failed', message: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    )
  }
}
