import { createClient } from '@/lib/supabase/server'
import { getLatestGitHubDeployment } from '@/lib/github/workflows'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'

export const maxDuration = 30

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    let executionId = ''
    try {
      executionId = await recordActionStart(projectId, 6, 'launch_checklist', 0, 'smoke-test')
    } catch { /* non-fatal */ }

    // Find the production URL
    let prodUrl = project.vercel_project_url

    if (!prodUrl && project.repo_url) {
      const deployment = await getLatestGitHubDeployment(project.repo_url, 'Production')
      if (deployment?.environmentUrl) prodUrl = deployment.environmentUrl
    }

    if (!prodUrl) {
      if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, 'No production URL found')
      return Response.json({
        success: false,
        error: 'No se encontro URL de produccion. Deploya primero.',
      })
    }

    // Health check: fetch the production URL
    const checks: Array<{ name: string; status: 'pass' | 'fail'; detail: string }> = []

    // Check 1: Homepage loads
    try {
      const res = await fetch(prodUrl, { redirect: 'follow' })
      checks.push({
        name: 'Homepage carga',
        status: res.ok ? 'pass' : 'fail',
        detail: res.ok ? `HTTP ${res.status} OK` : `HTTP ${res.status}`,
      })
    } catch (err) {
      checks.push({ name: 'Homepage carga', status: 'fail', detail: err instanceof Error ? err.message : 'Error' })
    }

    // Check 2: API health (try /api/health or just check response headers)
    try {
      const apiRes = await fetch(`${prodUrl}/api/auth/login`, { method: 'HEAD' })
      checks.push({
        name: 'API responde',
        status: apiRes.status < 500 ? 'pass' : 'fail',
        detail: `HTTP ${apiRes.status}`,
      })
    } catch {
      checks.push({ name: 'API responde', status: 'fail', detail: 'No responde' })
    }

    const passed = checks.every((c) => c.status === 'pass')

    if (executionId) {
      await recordActionComplete(
        executionId,
        passed ? 'success' : 'failed',
        passed ? 'Smoke test passed' : 'Smoke test failed',
        { checks, url: prodUrl },
      )
    }

    return Response.json({
      success: passed,
      url: prodUrl,
      checks,
    })
  } catch (error) {
    console.error('[smoke-test] Error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
