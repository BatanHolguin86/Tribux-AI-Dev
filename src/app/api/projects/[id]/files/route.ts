import { createClient } from '@/lib/supabase/server'
import { fetchFileContent } from '@/lib/github/file-content'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('repo_url')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project?.repo_url) {
    return Response.json({ error: 'no_repo' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return Response.json({ error: 'path required' }, { status: 400 })
  }

  try {
    const content = await fetchFileContent(project.repo_url, path)
    return Response.json({ content: content?.slice(0, 15000) ?? null, path })
  } catch {
    return Response.json({ content: null, path })
  }
}
