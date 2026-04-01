import { createClient } from '@/lib/supabase/server'
import { getLatestWorkflowRun } from '@/lib/github/workflows'
import { parseGitHubUrl } from '@/lib/github/repo-context'

export const maxDuration = 60

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 3. Try Vercel API first if VERCEL_TOKEN is available
    if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID) {
      try {
        const parsed = project.repo_url ? parseGitHubUrl(project.repo_url) : null
        const repoName = parsed ? parsed.repo : null

        if (repoName) {
          const vercelRes = await fetch(
            `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(repoName)}&limit=1&teamId=${process.env.VERCEL_TEAM_ID}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
              },
            },
          )

          if (vercelRes.ok) {
            const data = await vercelRes.json()
            const deployment = data.deployments?.[0]

            if (deployment) {
              return Response.json({
                status: deployment.readyState ?? deployment.state,
                url: deployment.url ? `https://${deployment.url}` : null,
                source: 'vercel',
                createdAt: deployment.created,
              })
            }
          }
        }
      } catch (vercelError) {
        console.error('[deploy-status] Vercel API error (non-fatal):', vercelError)
      }
    }

    // 4. Fallback to GitHub Actions deploy workflow
    if (project.repo_url) {
      const run = await getLatestWorkflowRun(project.repo_url, 'deploy.yml')

      if (run) {
        return Response.json({
          status: run.status === 'completed' ? run.conclusion : run.status,
          url: run.html_url,
          source: 'github_actions',
        })
      }
    }

    return Response.json({
      status: 'unknown',
      url: null,
      source: null,
    })
  } catch (error) {
    console.error('[deploy-status] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: 'action_failed', message },
      { status: 500 },
    )
  }
}
