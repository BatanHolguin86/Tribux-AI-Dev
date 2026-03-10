import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  // Verify all tasks are done
  const { data: tasks } = await supabase
    .from('project_tasks')
    .select('id, status')
    .eq('project_id', projectId)

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ error: 'No hay tasks' }, { status: 400 })
  }

  const pending = tasks.filter((t) => t.status !== 'done')
  if (pending.length > 0) {
    return NextResponse.json(
      { error: `${pending.length} tasks pendientes` },
      { status: 400 }
    )
  }

  // Complete Phase 04
  await supabase
    .from('project_phases')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('project_id', projectId)
    .eq('phase_number', 4)

  // Unlock Phase 05
  await supabase
    .from('project_phases')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('phase_number', 5)

  // Update project current phase
  await supabase
    .from('projects')
    .update({ current_phase: 5, last_activity: new Date().toISOString() })
    .eq('id', projectId)

  return NextResponse.json({
    phase: 4,
    status: 'completed',
    next_phase: 5,
    unlocked: true,
  })
}
