import { createClient } from '@/lib/supabase/server'
import { getLatestWorkflowRun } from '@/lib/github/workflows'

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
      return Response.json(
        { error: 'no_repo', message: 'El proyecto no tiene repositorio GitHub conectado.' },
        { status: 400 },
      )
    }

    // 3. Get latest CI workflow run
    const run = await getLatestWorkflowRun(project.repo_url, 'ci.yml')

    if (!run) {
      return Response.json({
        status: 'not_found',
        conclusion: null,
        html_url: null,
      })
    }

    return Response.json({
      status: run.status,
      conclusion: run.conclusion,
      html_url: run.html_url,
    })
  } catch (error) {
    console.error('[ci-status] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: 'action_failed', message },
      { status: 500 },
    )
  }
}
