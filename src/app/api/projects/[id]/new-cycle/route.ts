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

  // Verify project belongs to user and is completed
  const { data: project } = await supabase
    .from('projects')
    .select('id, status, cycle_number, user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  if (project.status !== 'completed') {
    return NextResponse.json(
      { error: 'El proyecto debe estar completado para iniciar un nuevo ciclo' },
      { status: 400 }
    )
  }

  const newCycleNumber = (project.cycle_number ?? 1) + 1

  // Delete ephemeral data (preserve knowledge_base_entries + design_artifacts)
  await Promise.all([
    supabase.from('phase_sections').delete().eq('project_id', projectId),
    supabase.from('agent_conversations').delete().eq('project_id', projectId),
    supabase.from('project_tasks').delete().eq('project_id', projectId),
    supabase.from('project_documents').delete().eq('project_id', projectId),
  ])

  // Delete feature documents then features
  const { data: features } = await supabase
    .from('project_features')
    .select('id')
    .eq('project_id', projectId)

  if (features && features.length > 0) {
    const featureIds = features.map((f) => f.id)
    await supabase.from('feature_documents').delete().in('feature_id', featureIds)
    await supabase.from('project_features').delete().eq('project_id', projectId)
  }

  // Reset project phases: Phase 0 → active, Phases 1-7 → locked
  await supabase
    .from('project_phases')
    .update({
      status: 'locked',
      started_at: null,
      completed_at: null,
      approved_at: null,
      approved_by: null,
    })
    .eq('project_id', projectId)

  await supabase
    .from('project_phases')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('phase_number', 0)

  // Update project
  await supabase
    .from('projects')
    .update({
      cycle_number: newCycleNumber,
      current_phase: 0,
      status: 'active',
      last_activity: new Date().toISOString(),
    })
    .eq('id', projectId)

  return NextResponse.json({
    cycle_number: newCycleNumber,
    status: 'active',
  })
}
