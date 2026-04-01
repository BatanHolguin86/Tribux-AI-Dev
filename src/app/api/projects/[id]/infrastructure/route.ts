import { createClient } from '@/lib/supabase/server'
import { parseGitHubUrl } from '@/lib/github/repo-context'
import { getLatestGitHubDeployment, getLatestWorkflowRun } from '@/lib/github/workflows'

export type ServiceStatus = 'connected' | 'partial' | 'missing' | 'error'

export type InfraService = {
  id: string
  status: ServiceStatus
  details: Record<string, unknown>
}

const GITHUB_API = 'https://api.github.com'

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

    const services: InfraService[] = []

    // ── 1. GitHub ──────────────────────────────────────────────────────────────
    if (!project.repo_url) {
      services.push({ id: 'github', status: 'missing', details: { reason: 'No hay repositorio configurado' } })
    } else {
      try {
        const parsed = parseGitHubUrl(project.repo_url)
        if (!parsed) throw new Error('URL inválida')

        const res = await fetch(
          `${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}`,
          {
            headers: {
              Authorization: `token ${process.env.GITHUB_TOKEN ?? ''}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'AI-Squad-Command-Center',
            },
          },
        )

        if (res.ok) {
          const data = await res.json()
          services.push({
            id: 'github',
            status: 'connected',
            details: {
              repoName: data.full_name,
              url: data.html_url,
              defaultBranch: data.default_branch,
              private: data.private,
              pushedAt: data.pushed_at,
            },
          })
        } else if (res.status === 404) {
          services.push({ id: 'github', status: 'partial', details: { url: project.repo_url, error: 'Repo no encontrado o privado (verifica GITHUB_TOKEN)' } })
        } else {
          services.push({ id: 'github', status: 'partial', details: { url: project.repo_url, error: `GitHub API HTTP ${res.status}` } })
        }
      } catch {
        services.push({ id: 'github', status: 'error', details: { url: project.repo_url, error: 'No se pudo conectar a GitHub API' } })
      }
    }

    // ── 2. Supabase ────────────────────────────────────────────────────────────
    const hasRef = !!project.supabase_project_ref
    const hasToken = !!project.supabase_access_token

    if (!hasRef && !hasToken) {
      services.push({ id: 'supabase', status: 'missing', details: { reason: 'Project ref y access token no configurados' } })
    } else if (!hasToken) {
      services.push({ id: 'supabase', status: 'partial', details: { projectRef: project.supabase_project_ref, reason: 'Falta el access token' } })
    } else {
      try {
        const res = await fetch(
          `https://api.supabase.com/v1/projects/${project.supabase_project_ref}`,
          { headers: { Authorization: `Bearer ${project.supabase_access_token}` } },
        )

        if (res.ok) {
          const data = await res.json()
          services.push({
            id: 'supabase',
            status: 'connected',
            details: {
              projectRef: project.supabase_project_ref,
              name: data.name,
              region: data.region,
              dbStatus: data.status,
            },
          })
        } else {
          services.push({
            id: 'supabase',
            status: 'partial',
            details: { projectRef: project.supabase_project_ref, error: `Supabase API HTTP ${res.status} — verifica el token` },
          })
        }
      } catch {
        services.push({
          id: 'supabase',
          status: 'partial',
          details: { projectRef: project.supabase_project_ref, error: 'No se pudo conectar a Supabase API' },
        })
      }
    }

    // ── 3. GitHub Actions CI ───────────────────────────────────────────────────
    if (!project.repo_url) {
      services.push({ id: 'github_actions', status: 'missing', details: { reason: 'Requiere repositorio GitHub configurado' } })
    } else {
      try {
        const run = await getLatestWorkflowRun(project.repo_url, 'ci.yml')
        if (run) {
          services.push({
            id: 'github_actions',
            status: run.conclusion === 'failure' ? 'partial' : 'connected',
            details: {
              runUrl: run.html_url,
              status: run.status,
              conclusion: run.conclusion,
              updatedAt: run.updated_at,
            },
          })
        } else {
          services.push({
            id: 'github_actions',
            status: 'missing',
            details: { reason: 'ci.yml no encontrado — ejecuta "Configurar CI" en Phase 05' },
          })
        }
      } catch {
        services.push({ id: 'github_actions', status: 'missing', details: { reason: 'No se pudo verificar CI' } })
      }
    }

    // ── 4. Vercel (vía GitHub Deployments API) ─────────────────────────────────
    if (!project.repo_url) {
      services.push({ id: 'vercel', status: 'missing', details: { reason: 'Requiere repositorio GitHub configurado' } })
    } else {
      try {
        const deployment = await getLatestGitHubDeployment(project.repo_url, 'Production')
        if (deployment) {
          const isSuccess = deployment.status === 'success'
          const isError = deployment.status === 'failure' || deployment.status === 'error'
          services.push({
            id: 'vercel',
            status: isSuccess ? 'connected' : isError ? 'partial' : 'partial',
            details: {
              status: deployment.status,
              url: deployment.environmentUrl,
              createdAt: deployment.createdAt,
            },
          })
        } else {
          const deployRun = await getLatestWorkflowRun(project.repo_url, 'deploy.yml')
          if (deployRun) {
            services.push({
              id: 'vercel',
              status: 'partial',
              details: {
                reason: 'deploy.yml existe pero sin deployment en Vercel aún',
                workflowUrl: deployRun.html_url,
                lastRun: deployRun.conclusion ?? deployRun.status,
              },
            })
          } else {
            services.push({
              id: 'vercel',
              status: 'missing',
              details: { reason: 'Sin deploy.yml ni deployments — ejecuta "Configurar deploy" en Phase 06' },
            })
          }
        }
      } catch {
        services.push({ id: 'vercel', status: 'missing', details: { reason: 'No se pudo verificar deploy' } })
      }
    }

    // ── 5. Anthropic AI ────────────────────────────────────────────────────────
    services.push({
      id: 'anthropic',
      status: process.env.ANTHROPIC_API_KEY ? 'connected' : 'missing',
      details: {
        model: 'claude-sonnet-4-6',
        configured: !!process.env.ANTHROPIC_API_KEY,
        reason: process.env.ANTHROPIC_API_KEY ? undefined : 'ANTHROPIC_API_KEY no configurado en el servidor',
      },
    })

    // ── 6. Sentry (opcional) ───────────────────────────────────────────────────
    const sentryConfigured =
      !!process.env.SENTRY_AUTH_TOKEN && !!process.env.SENTRY_ORG && !!process.env.SENTRY_PROJECT
    services.push({
      id: 'sentry',
      status: sentryConfigured ? 'connected' : 'missing',
      details: {
        configured: sentryConfigured,
        org: process.env.SENTRY_ORG ?? null,
        project: process.env.SENTRY_PROJECT ?? null,
        reason: !sentryConfigured ? 'Opcional — configura SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT' : undefined,
      },
    })

    return Response.json({ services })
  } catch (error) {
    console.error('[infrastructure] Error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
