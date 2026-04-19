import { createClient } from '@/lib/supabase/server'
import { parseGitHubUrl } from '@/lib/github/repo-context'
import { getLatestWorkflowRun, getLatestGitHubDeployment } from '@/lib/github/workflows'
import { getPlatformToken } from '@/lib/platform/config'

export const maxDuration = 30

type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip'

type ReadinessCheck = {
  id: string
  label: string
  status: CheckStatus
  detail: string
  url?: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: project } = await supabase
      .from('projects')
      .select('id, name, repo_url, supabase_project_ref, supabase_access_token, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const checks: ReadinessCheck[] = []

    // ── 1. GitHub repo ────────────────────────────────────────────────────────
    if (!project.repo_url) {
      checks.push({ id: 'github', label: 'Repositorio GitHub', status: 'fail', detail: 'No configurado' })
    } else {
      const parsed = parseGitHubUrl(project.repo_url)
      if (!parsed) {
        checks.push({ id: 'github', label: 'Repositorio GitHub', status: 'fail', detail: 'URL invalida' })
      } else {
        try {
          // Use platform token (PLATFORM_GITHUB_TOKEN) for private org repos
          let ghToken = process.env.GITHUB_TOKEN ?? ''
          try {
            const platform = await getPlatformToken('github')
            ghToken = platform.token
          } catch { /* fallback to GITHUB_TOKEN */ }

          const res = await fetch(
            `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
            {
              headers: {
                Authorization: `token ${ghToken}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'Tribux AI',
              },
            },
          )
          checks.push({
            id: 'github',
            label: 'Repositorio GitHub',
            status: res.ok ? 'pass' : 'fail',
            detail: res.ok ? `${parsed.owner}/${parsed.repo}` : `HTTP ${res.status}`,
            url: project.repo_url,
          })
        } catch {
          checks.push({ id: 'github', label: 'Repositorio GitHub', status: 'fail', detail: 'No se pudo conectar' })
        }
      }
    }

    // ── 2. Supabase ───────────────────────────────────────────────────────────
    if (!project.supabase_project_ref) {
      checks.push({
        id: 'supabase',
        label: 'Base de datos (Supabase)',
        status: 'fail',
        detail: 'No configurado',
      })
    } else {
      try {
        // Use platform management token (PLATFORM_SUPABASE_TOKEN), not the project's service role key
        const platform = await getPlatformToken('supabase')
        const res = await fetch(
          `https://api.supabase.com/v1/projects/${project.supabase_project_ref}`,
          { headers: { Authorization: `Bearer ${platform.token}` } },
        )
        checks.push({
          id: 'supabase',
          label: 'Base de datos (Supabase)',
          status: res.ok ? 'pass' : 'warn',
          detail: res.ok ? `Proyecto ${project.supabase_project_ref}` : `HTTP ${res.status}`,
        })
      } catch {
        checks.push({
          id: 'supabase',
          label: 'Base de datos (Supabase)',
          status: 'warn',
          detail: 'No se pudo verificar — token de management no configurado',
        })
      }
    }

    // ── 3. CI (GitHub Actions) ────────────────────────────────────────────────
    if (!project.repo_url) {
      checks.push({ id: 'ci', label: 'CI (GitHub Actions)', status: 'skip', detail: 'Requiere repo' })
    } else {
      try {
        const run = await getLatestWorkflowRun(project.repo_url, 'ci.yml')
        if (!run) {
          checks.push({ id: 'ci', label: 'CI (GitHub Actions)', status: 'warn', detail: 'ci.yml no encontrado' })
        } else {
          const passed = run.conclusion === 'success'
          checks.push({
            id: 'ci',
            label: 'CI (GitHub Actions)',
            status: passed ? 'pass' : 'fail',
            detail: passed ? 'Ultimo run exitoso' : `Conclusion: ${run.conclusion ?? run.status}`,
            url: run.html_url,
          })
        }
      } catch {
        checks.push({ id: 'ci', label: 'CI (GitHub Actions)', status: 'skip', detail: 'Error al verificar' })
      }
    }

    // ── 4. Deploy (Vercel) ────────────────────────────────────────────────────
    if (!project.repo_url) {
      checks.push({ id: 'deploy', label: 'Deploy (Vercel)', status: 'skip', detail: 'Requiere repo' })
    } else {
      try {
        const deployment = await getLatestGitHubDeployment(project.repo_url, 'Production')
        if (deployment) {
          const ok = deployment.status === 'success'
          checks.push({
            id: 'deploy',
            label: 'Deploy (Vercel)',
            status: ok ? 'pass' : 'warn',
            detail: ok ? 'Deploy activo' : `Status: ${deployment.status}`,
            url: deployment.environmentUrl ?? undefined,
          })
        } else {
          const deployRun = await getLatestWorkflowRun(project.repo_url, 'deploy.yml')
          checks.push({
            id: 'deploy',
            label: 'Deploy (Vercel)',
            status: deployRun ? 'warn' : 'fail',
            detail: deployRun ? 'Workflow existe, sin deploy aun' : 'Sin deploy configurado',
            url: deployRun?.html_url,
          })
        }
      } catch {
        checks.push({ id: 'deploy', label: 'Deploy (Vercel)', status: 'skip', detail: 'Error al verificar' })
      }
    }

    // ── 5. Anthropic API Key ──────────────────────────────────────────────────
    checks.push({
      id: 'anthropic',
      label: 'API Key (Anthropic)',
      status: process.env.ANTHROPIC_API_KEY ? 'pass' : 'fail',
      detail: process.env.ANTHROPIC_API_KEY ? 'Configurada' : 'ANTHROPIC_API_KEY no configurada',
    })

    // ── 6. Error tracking (Sentry) — optional ─────────────────────────────────
    const sentryConfigured =
      !!process.env.SENTRY_AUTH_TOKEN && !!process.env.SENTRY_ORG && !!process.env.SENTRY_PROJECT
    checks.push({
      id: 'sentry',
      label: 'Sentry (opcional)',
      status: sentryConfigured ? 'pass' : 'skip',
      detail: sentryConfigured ? 'Configurado' : 'No configurado (opcional)',
    })

    // ── 7. Phase completion ───────────────────────────────────────────────────
    const { data: phases } = await supabase
      .from('project_phases')
      .select('phase_number, status')
      .eq('project_id', projectId)
      .in('phase_number', [0, 1, 2, 3, 4, 5])
      .order('phase_number')

    const approvedPhases = (phases ?? []).filter((p) => p.status === 'approved' || p.status === 'completed')
    const phaseNames = ['Discovery', 'KIRO Specs', 'Architecture', 'Environment', 'Development', 'Testing']
    const phaseDetail = approvedPhases.length >= 6
      ? 'Phases 00-05 completadas'
      : `${approvedPhases.length}/6 — pendiente: ${phaseNames.filter((_, i) => !approvedPhases.find((p) => p.phase_number === i)).join(', ')}`

    checks.push({
      id: 'phases',
      label: 'Fases previas (00-05)',
      status: approvedPhases.length >= 6 ? 'pass' : approvedPhases.length >= 3 ? 'warn' : 'fail',
      detail: phaseDetail,
    })

    // ── Aggregate ─────────────────────────────────────────────────────────────
    const passCount = checks.filter((c) => c.status === 'pass').length
    const failCount = checks.filter((c) => c.status === 'fail').length
    const total = checks.filter((c) => c.status !== 'skip').length
    const score = total > 0 ? Math.round((passCount / total) * 100) : 0

    return Response.json({
      score,
      overall: failCount === 0 ? 'ready' : 'not_ready',
      checks,
      summary: `${passCount}/${total} checks passing`,
    })
  } catch (error) {
    console.error('[readiness] Error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
