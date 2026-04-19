import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PHASE07_SECTIONS } from '@/lib/ai/prompts/phase-07'
import { notifyPhaseApproved } from '@/lib/email/send'

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

  // Auto-complete pending sections for founder personas (they see simplified UI)
  const { data: sections } = await supabase
    .from('phase_sections')
    .select('section, status')
    .eq('project_id', projectId)
    .eq('phase_number', 6)

  const pendingSections = (sections ?? []).filter(
    (s) => s.status !== 'completed' && s.status !== 'approved'
  )

  if (pendingSections.length > 0) {
    for (const s of pendingSections) {
      await supabase
        .from('phase_sections')
        .upsert(
          { project_id: projectId, phase_number: 6, section: s.section, status: 'completed' },
          { onConflict: 'project_id,phase_number,section' }
        )
    }
  }

  // Complete Phase 06
  await supabase
    .from('project_phases')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('project_id', projectId)
    .eq('phase_number', 6)

  // Unlock Phase 07
  await supabase
    .from('project_phases')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('phase_number', 7)

  // Create Phase 07 sections
  for (const section of PHASE07_SECTIONS) {
    await supabase.from('phase_sections').upsert(
      {
        project_id: projectId,
        phase_number: 7,
        section,
        status: 'pending',
      },
      { onConflict: 'project_id,phase_number,section' }
    )
  }

  // Update project current phase
  await supabase
    .from('projects')
    .update({ current_phase: 7, last_activity: new Date().toISOString() })
    .eq('id', projectId)

  // Fire-and-forget email notification
  notifyPhaseApproved(supabase, user.email ?? '', projectId, 6)

  return NextResponse.json({
    phase: 6,
    status: 'completed',
    next_phase: 7,
    unlocked: true,
  })
}
