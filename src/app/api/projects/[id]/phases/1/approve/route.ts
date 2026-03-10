import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PHASE02_SECTIONS } from '@/lib/ai/prompts/phase-02'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Verify all features have status spec_complete or approved
  const { data: features } = await supabase
    .from('project_features')
    .select('name, status')
    .eq('project_id', projectId)

  if (!features || features.length === 0) {
    return NextResponse.json({ error: 'No hay features definidos' }, { status: 400 })
  }

  const pending = features.filter((f) => f.status !== 'spec_complete' && f.status !== 'approved')
  if (pending.length > 0) {
    return NextResponse.json(
      { error: 'Faltan features por aprobar', pending: pending.map((f) => f.name) },
      { status: 400 }
    )
  }

  // Mark all features as approved
  await supabase
    .from('project_features')
    .update({ status: 'approved' })
    .eq('project_id', projectId)
    .eq('status', 'spec_complete')

  // Complete Phase 01
  await supabase
    .from('project_phases')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('project_id', projectId)
    .eq('phase_number', 1)

  // Unlock Phase 02
  await supabase
    .from('project_phases')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('project_id', projectId)
    .eq('phase_number', 2)

  // Create Phase 02 sections
  for (const section of PHASE02_SECTIONS) {
    await supabase
      .from('phase_sections')
      .upsert(
        {
          project_id: projectId,
          phase_number: 2,
          section,
          status: 'pending',
        },
        { onConflict: 'project_id,phase_number,section' }
      )
  }

  await supabase
    .from('projects')
    .update({ current_phase: 2, last_activity: new Date().toISOString() })
    .eq('id', projectId)

  return NextResponse.json({ phase: 1, status: 'completed', next_phase: 2, unlocked: true })
}
