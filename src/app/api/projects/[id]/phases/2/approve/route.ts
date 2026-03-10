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

  // Verify all 4 sections are approved
  const { data: sections } = await supabase
    .from('phase_sections')
    .select('section, status')
    .eq('project_id', projectId)
    .eq('phase_number', 2)

  const pending = (sections ?? []).filter((s) => s.status !== 'approved')

  if (pending.length > 0) {
    return NextResponse.json(
      {
        error: 'Faltan secciones por aprobar',
        pending: pending.map((s) => s.section),
      },
      { status: 400 }
    )
  }

  // Complete Phase 02
  await supabase
    .from('project_phases')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('project_id', projectId)
    .eq('phase_number', 2)

  // Unlock Phase 03
  await supabase
    .from('project_phases')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('phase_number', 3)

  // Update project current phase
  await supabase
    .from('projects')
    .update({ current_phase: 3, last_activity: new Date().toISOString() })
    .eq('id', projectId)

  return NextResponse.json({
    phase: 2,
    status: 'completed',
    next_phase: 3,
    unlocked: true,
  })
}
