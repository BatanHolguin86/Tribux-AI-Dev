import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseTasksFromMarkdown } from '@/lib/tasks/parse-tasks'

// GET — List all tasks for this project
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: tasks } = await supabase
    .from('project_tasks')
    .select('*, project_features(name)')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true })

  return NextResponse.json({ tasks: tasks ?? [] })
}

// POST — Generate tasks from approved KIRO specs
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Check if tasks already exist
  const { count: existingCount } = await supabase
    .from('project_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  if ((existingCount ?? 0) > 0) {
    return NextResponse.json({ error: 'Tasks already generated' }, { status: 409 })
  }

  // Get all approved tasks.md documents from features
  const { data: featureDocs } = await supabase
    .from('feature_documents')
    .select('feature_id, content, project_features(name)')
    .eq('project_id', projectId)
    .eq('document_type', 'tasks')
    .eq('status', 'approved')

  if (!featureDocs || featureDocs.length === 0) {
    return NextResponse.json({ error: 'No approved task specs found' }, { status: 400 })
  }

  let globalOrder = 0
  const allTasks: Array<{
    project_id: string
    feature_id: string
    task_key: string
    title: string
    category: string
    status: string
    display_order: number
  }> = []

  for (const doc of featureDocs) {
    if (!doc.content) continue

    const parsed = parseTasksFromMarkdown(doc.content)

    for (const task of parsed) {
      allTasks.push({
        project_id: projectId,
        feature_id: doc.feature_id,
        task_key: task.task_key,
        title: task.title,
        category: task.category,
        status: 'todo',
        display_order: globalOrder++,
      })
    }
  }

  if (allTasks.length === 0) {
    return NextResponse.json({ error: 'No tasks found in specs' }, { status: 400 })
  }

  const { error } = await supabase.from('project_tasks').insert(allTasks)

  if (error) {
    console.error('[Phase-04 tasks] Error inserting tasks', error)
    return NextResponse.json({ error: 'Error creating tasks' }, { status: 500 })
  }

  return NextResponse.json({
    created: allTasks.length,
    message: `${allTasks.length} tasks created from ${featureDocs.length} feature specs`,
  }, { status: 201 })
}
