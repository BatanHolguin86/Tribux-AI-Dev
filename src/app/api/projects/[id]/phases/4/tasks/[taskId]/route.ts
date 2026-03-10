import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH — Update task status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: projectId, taskId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { status } = await request.json()

  const validStatuses = ['todo', 'in_progress', 'review', 'done']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
  }

  const { error } = await supabase
    .from('project_tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('project_id', projectId)

  if (error) {
    return NextResponse.json({ error: 'Error updating task' }, { status: 500 })
  }

  return NextResponse.json({ id: taskId, status })
}
