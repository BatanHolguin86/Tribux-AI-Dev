import { createClient } from '@/lib/supabase/server'
import { getRollbackTarget, createRollbackRelease } from '@/lib/github/workflows'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'

export const maxDuration = 120

/**
 * POST /api/projects/[id]/phases/6/actions/monitor
 * Post-deploy monitoring: 3 health checks at 1min intervals.
 * If 2 consecutive checks fail → auto-rollback + alert.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, repo_url, vercel_project_url, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return Response.json({ error: 'not_found' }, { status: 404 })

  const prodUrl = project.vercel_project_url
  if (!prodUrl) {
    return Response.json({ error: 'No hay URL de produccion.' }, { status: 400 })
  }

  let executionId = ''
  try {
    executionId = await recordActionStart(projectId, 6, 'launch_checklist', 0, 'monitor')
  } catch { /* non-fatal */ }

  const results: Array<{ check: number; timestamp: string; homepage: boolean; api: boolean }> = []
  let consecutiveFails = 0

  for (let i = 0; i < 3; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 60_000)) // Wait 1 min between checks

    let homepageOk = false
    let apiOk = false

    try {
      const res = await fetch(prodUrl, { redirect: 'follow' })
      homepageOk = res.ok
    } catch { homepageOk = false }

    try {
      const res = await fetch(`${prodUrl}/api/auth/login`, { method: 'HEAD' })
      apiOk = res.status < 500
    } catch { apiOk = false }

    const passed = homepageOk && apiOk
    results.push({
      check: i + 1,
      timestamp: new Date().toISOString(),
      homepage: homepageOk,
      api: apiOk,
    })

    if (!passed) {
      consecutiveFails++
    } else {
      consecutiveFails = 0
    }

    // 2 consecutive fails → auto-rollback
    if (consecutiveFails >= 2 && project.repo_url) {
      const rollbackTarget = await getRollbackTarget(project.repo_url)

      if (rollbackTarget) {
        await createRollbackRelease(project.repo_url, rollbackTarget.commitSha, rollbackTarget.tag)

        if (executionId) {
          await recordActionComplete(executionId, 'failed', `Monitoring: 2 fallos consecutivos. Rollback a ${rollbackTarget.tag}`, {
            results,
            rollbackTo: rollbackTarget.tag,
            autoRollback: true,
          })
        }

        return Response.json({
          success: false,
          action: 'rollback',
          message: `Monitoring detecto 2 fallos consecutivos. Se revirtio automaticamente a ${rollbackTarget.tag}.`,
          results,
          rollbackTo: rollbackTarget.tag,
        })
      }
    }
  }

  const allPassed = results.every((r) => r.homepage && r.api)

  if (executionId) {
    await recordActionComplete(
      executionId,
      allPassed ? 'success' : 'failed',
      allPassed ? 'Monitoring: 3/3 checks exitosos' : 'Monitoring: algunos checks fallaron',
      { results },
    )
  }

  return Response.json({
    success: allPassed,
    action: allPassed ? 'none' : 'alert',
    message: allPassed
      ? 'Monitoring completado: tu app esta funcionando correctamente.'
      : 'Monitoring detecto problemas pero no suficientes para rollback automatico.',
    results,
  })
}
