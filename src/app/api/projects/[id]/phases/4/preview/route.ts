import { createClient } from '@/lib/supabase/server'
import { getPreviewDeployment, getLatestGitHubDeployment } from '@/lib/github/workflows'

export async function GET(
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
      .select('id, repo_url')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project?.repo_url) {
      return Response.json({ status: 'no_repo' })
    }

    const { searchParams } = new URL(request.url)
    const branch = searchParams.get('branch')

    // If branch specified, get preview deployment for that branch
    if (branch) {
      const preview = await getPreviewDeployment(project.repo_url, branch)
      if (preview?.url) {
        return Response.json({
          status: preview.status,
          url: preview.url,
          branch,
          type: 'preview',
        })
      }
    }

    // Fallback: get production deployment
    const prod = await getLatestGitHubDeployment(project.repo_url, 'Production')
    if (prod?.environmentUrl) {
      return Response.json({
        status: prod.status,
        url: prod.environmentUrl,
        type: 'production',
      })
    }

    return Response.json({ status: 'no_deployment' })
  } catch {
    return Response.json({ status: 'error' })
  }
}
