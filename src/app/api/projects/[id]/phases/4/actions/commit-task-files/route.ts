import { createClient } from '@/lib/supabase/server'
import { extractCodeFiles } from '@/lib/ai/code-extractor'
import { commitMultipleFiles } from '@/lib/github/commit'
import { createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await request.json()
  const { taskId, generatedText }: { taskId: string; generatedText: string } = body

  if (!taskId || !generatedText) {
    return Response.json({ error: 'taskId and generatedText required' }, { status: 400 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, repo_url')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project?.repo_url) return Response.json({ error: 'no_repo' }, { status: 400 })

  const { data: task } = await supabase
    .from('project_tasks')
    .select('task_key, title, project_features(name)')
    .eq('id', taskId)
    .eq('project_id', projectId)
    .single()

  if (!task) return Response.json({ error: 'task_not_found' }, { status: 404 })

  // Extract files from AI-generated text
  const files = extractCodeFiles(generatedText)
  if (files.length === 0) {
    return Response.json({ error: 'no_files_extracted', message: 'No se encontraron archivos con filepath annotations en el texto generado.' }, { status: 422 })
  }

  // Commit all files to GitHub in one commit
  const result = await commitMultipleFiles(
    project.repo_url,
    files.map((f) => ({ path: f.path, content: f.content })),
    `feat(${task.task_key}): ${task.title}`,
  )

  // Update task status to 'review'
  await supabase
    .from('project_tasks')
    .update({ status: 'review' })
    .eq('id', taskId)
    .eq('project_id', projectId)

  // Save to knowledge base for future sessions
  const featureName =
    (task.project_features as unknown as { name: string })?.name ?? 'Unknown Feature'
  const adminClient = await createAdminClient()
  await adminClient.from('knowledge_base_entries').insert({
    project_id: projectId,
    title: `Built: ${task.task_key} — ${task.title}`,
    content: `Task ${task.task_key} implemented for feature "${featureName}". Files: ${files.map((f) => f.path).join(', ')}. Commit: ${result.sha}`,
    summary: `Built ${task.task_key}: ${task.title} (${files.length} files, commit ${result.sha.slice(0, 8)})`,
    category: 'agent_memory',
    source_type: 'agent',
    source_id: taskId,
    is_pinned: false,
  })

  return Response.json({
    success: true,
    sha: result.sha,
    url: result.url,
    filesChanged: result.filesChanged,
    files: files.map((f) => f.path),
  })
}
