import { createClient } from '@/lib/supabase/server'
import { getLatestWorkflowRun, getLatestGitHubDeployment } from '@/lib/github/workflows'

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

    if (!project.repo_url) {
      return Response.json({ status: 'no_repo', url: null, source: null })
    }

    // 3. Primary: GitHub Deployments API (Vercel creates these automatically)
    const ghDeployment = await getLatestGitHubDeployment(project.repo_url, 'Production')
    if (ghDeployment) {
      return Response.json({
        status: ghDeployment.status,
        url: ghDeployment.environmentUrl,
        source: 'github_deployment',
        createdAt: ghDeployment.createdAt,
      })
    }

    // 4. Fallback: GitHub Actions deploy.yml workflow run
    const run = await getLatestWorkflowRun(project.repo_url, 'deploy.yml')
    if (run) {
      return Response.json({
        status: run.status === 'completed' ? (run.conclusion ?? 'completed') : run.status,
        url: run.html_url,
        source: 'github_actions',
      })
    }

    return Response.json({
      status: 'not_started',
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
