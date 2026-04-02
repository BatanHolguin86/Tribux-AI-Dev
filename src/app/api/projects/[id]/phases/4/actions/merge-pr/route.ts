import { createClient } from '@/lib/supabase/server'
import { mergePullRequest } from '@/lib/github/commit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: project } = await supabase
      .from('projects')
      .select('id, repo_url, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project?.repo_url) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const body = await request.json()
    const prNumber = body.pr_number as number
    const taskId = body.task_id as string | undefined

    if (!prNumber) {
      return Response.json({ error: 'pr_number required' }, { status: 400 })
    }

    const result = await mergePullRequest(project.repo_url, prNumber, 'squash')

    if (!result.success) {
      return Response.json({ error: 'merge_failed', message: result.error }, { status: 400 })
    }

    // Update task status to done if task_id provided
    if (taskId) {
      await supabase
        .from('project_tasks')
        .update({ status: 'done' })
        .eq('id', taskId)
        .eq('project_id', projectId)
    }

    return Response.json({ success: true, sha: result.sha })
  } catch (error) {
    console.error('[merge-pr] Error:', error)
    return Response.json(
      { error: 'internal_error', message: error instanceof Error ? error.message : 'Error' },
      { status: 500 },
    )
  }
}
