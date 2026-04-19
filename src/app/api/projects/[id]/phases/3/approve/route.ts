import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseTasksFromMarkdown } from '@/lib/tasks/parse-tasks'
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

  // Check if infrastructure is configured (repo + DB = sufficient)
  const { data: project } = await supabase
    .from('projects')
    .select('repo_url, supabase_project_ref')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  const hasInfra = !!project?.repo_url && !!project?.supabase_project_ref

  // If infrastructure is configured, auto-complete all pending sections
  if (hasInfra) {
    const { data: sections } = await supabase
      .from('phase_sections')
      .select('section, status')
      .eq('project_id', projectId)
      .eq('phase_number', 3)

    const pendingSections = (sections ?? []).filter(
      (s) => s.status !== 'completed' && s.status !== 'approved'
    )

    for (const s of pendingSections) {
      await supabase
        .from('phase_sections')
        .upsert(
          { project_id: projectId, phase_number: 3, section: s.section, status: 'completed' },
          { onConflict: 'project_id,phase_number,section' }
        )
    }
  } else {
    // No infrastructure — check sections manually
    const { data: sections } = await supabase
      .from('phase_sections')
      .select('section, status')
      .eq('project_id', projectId)
      .eq('phase_number', 3)

    const pending = (sections ?? []).filter(
      (s) => s.status !== 'completed' && s.status !== 'approved'
    )

    if (pending.length > 0) {
      return NextResponse.json(
        { error: 'Faltan categorias por completar', pending: pending.map((s) => s.section) },
        { status: 400 }
      )
    }
  }

  // Complete Phase 03
  await supabase
    .from('project_phases')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('project_id', projectId)
    .eq('phase_number', 3)

  // Unlock Phase 04
  await supabase
    .from('project_phases')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('phase_number', 4)

  // Generate tasks from approved KIRO specs
  const { data: featureDocs } = await supabase
    .from('feature_documents')
    .select('feature_id, content')
    .eq('project_id', projectId)
    .eq('document_type', 'tasks')
    .eq('status', 'approved')

  if (featureDocs && featureDocs.length > 0) {
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

    if (allTasks.length > 0) {
      await supabase.from('project_tasks').insert(allTasks)
    }
  }

  // Update project current phase
  await supabase
    .from('projects')
    .update({ current_phase: 4, last_activity: new Date().toISOString() })
    .eq('id', projectId)

  // Fire-and-forget email notification
  notifyPhaseApproved(supabase, user.email ?? '', projectId, 3)

  return NextResponse.json({
    phase: 3,
    status: 'completed',
    next_phase: 4,
    unlocked: true,
  })
}
