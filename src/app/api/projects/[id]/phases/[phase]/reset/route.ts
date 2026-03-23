import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const maxDuration = 30

/**
 * POST /api/projects/[id]/phases/[phase]/reset
 *
 * Resets a phase and all subsequent phases back to their initial state.
 * Deletes all documents, conversations, features, tasks, and artifacts
 * associated with the reset phases.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; phase: string }> }
) {
  const { id: projectId, phase } = await params
  const phaseNumber = parseInt(phase, 10)

  if (isNaN(phaseNumber) || phaseNumber < 0 || phaseNumber > 7) {
    return NextResponse.json({ error: 'Phase invalida' }, { status: 400 })
  }

  const supabase = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Verify user owns the project
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  // Determine which phases to reset: the target phase + all subsequent phases
  const phasesToReset = Array.from({ length: 8 - phaseNumber }, (_, i) => phaseNumber + i)

  // --- Delete phase-specific data for ALL phases being reset ---

  // 1. Delete feature_documents (Phase 01 data)
  if (phasesToReset.includes(1)) {
    // Get feature IDs for this project
    const { data: features } = await adminSupabase
      .from('project_features')
      .select('id')
      .eq('project_id', projectId)

    if (features && features.length > 0) {
      const featureIds = features.map((f) => f.id)
      await adminSupabase
        .from('feature_documents')
        .delete()
        .in('feature_id', featureIds)
    }

    // Reset features to pending (keep them, just reset status)
    await adminSupabase
      .from('project_features')
      .update({ status: 'pending' })
      .eq('project_id', projectId)
  }

  // 2. Delete project_tasks (Phase 04 data)
  if (phasesToReset.includes(4)) {
    await adminSupabase
      .from('project_tasks')
      .delete()
      .eq('project_id', projectId)
  }

  // 3. Delete design_artifacts (Phase 02 data)
  if (phasesToReset.includes(2)) {
    await adminSupabase
      .from('design_artifacts')
      .delete()
      .eq('project_id', projectId)
  }

  // 4. Delete phase_sections for all reset phases
  await adminSupabase
    .from('phase_sections')
    .delete()
    .eq('project_id', projectId)
    .in('phase_number', phasesToReset)

  // 5. Delete project_documents for all reset phases
  await adminSupabase
    .from('project_documents')
    .delete()
    .eq('project_id', projectId)
    .in('phase_number', phasesToReset)

  // 6. Delete agent_conversations for all reset phases
  await adminSupabase
    .from('agent_conversations')
    .delete()
    .eq('project_id', projectId)
    .in('phase_number', phasesToReset)

  // --- Reset phase statuses ---

  // Target phase → active
  await adminSupabase
    .from('project_phases')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
      completed_at: null,
      approved_at: null,
      approved_by: null,
    })
    .eq('project_id', projectId)
    .eq('phase_number', phaseNumber)

  // All subsequent phases → locked
  if (phasesToReset.length > 1) {
    const subsequentPhases = phasesToReset.slice(1)
    await adminSupabase
      .from('project_phases')
      .update({
        status: 'locked',
        started_at: null,
        completed_at: null,
        approved_at: null,
        approved_by: null,
      })
      .eq('project_id', projectId)
      .in('phase_number', subsequentPhases)
  }

  // Re-create phase_sections for Phase 00 if resetting it
  if (phaseNumber === 0) {
    const phase0Sections = [
      'problem_statement',
      'personas',
      'value_proposition',
      'metrics',
      'competitive_analysis',
    ]
    for (const section of phase0Sections) {
      await adminSupabase
        .from('phase_sections')
        .upsert(
          {
            project_id: projectId,
            phase_number: 0,
            section,
            status: 'pending',
          },
          { onConflict: 'project_id,phase_number,section' },
        )
    }
  }

  // Update project current_phase
  await adminSupabase
    .from('projects')
    .update({
      current_phase: phaseNumber,
      last_activity: new Date().toISOString(),
    })
    .eq('id', projectId)

  return NextResponse.json({
    success: true,
    reset_phase: phaseNumber,
    phases_affected: phasesToReset,
    message: `Phase ${String(phaseNumber).padStart(2, '0')} y posteriores reseteadas`,
  })
}
