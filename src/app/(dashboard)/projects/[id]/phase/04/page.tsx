import { createClient } from '@/lib/supabase/server'
import { Phase04Layout } from '@/components/phase-04/Phase04Layout'
import { PlanGuard } from '@/components/shared/PlanGuard'
import { canAccessPhase } from '@/lib/plans/guards'
import type { TaskWithFeature } from '@/types/task'

export default async function Phase04Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('user_profiles').select('plan, subscription_status, trial_ends_at').eq('id', user.id).single()
    : { data: null }

  if (!profile || !canAccessPhase(4, profile)) {
    return (
      <PlanGuard hasAccess={false} currentPlan={profile?.plan ?? 'starter'} feature="Phase 04 — Core Development">
        <div />
      </PlanGuard>
    )
  }

  // Fetch tasks with feature names
  const { data: tasks } = await supabase
    .from('project_tasks')
    .select('*, project_features(name)')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true })

  const tasksWithFeatures: TaskWithFeature[] = (tasks ?? []).map((t) => ({
    id: t.id,
    project_id: t.project_id,
    feature_id: t.feature_id,
    task_key: t.task_key,
    title: t.title,
    category: t.category,
    status: t.status,
    display_order: t.display_order,
    created_at: t.created_at,
    updated_at: t.updated_at,
    feature_name: (t.project_features as unknown as { name: string })?.name ?? null,
  }))

  const { data: approvedDesignRows } = await supabase
    .from('design_artifacts')
    .select('id, screen_name, type')
    .eq('project_id', projectId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  const approvedDesigns = (approvedDesignRows ?? []).map((r) => ({
    id: r.id as string,
    screen_name: r.screen_name as string,
    type: r.type as string,
  }))

  // Fetch CTO chat messages for Herramientas tab
  const { data: chatRow } = await supabase
    .from('agent_conversations')
    .select('messages')
    .eq('project_id', projectId)
    .eq('phase_number', 4)
    .eq('section', 'all')
    .eq('agent_type', 'orchestrator')
    .maybeSingle()

  const initialMessages = (chatRow?.messages as Array<{ role: string; content: string; created_at?: string }>) ?? []

  return (
    <Phase04Layout
      projectId={projectId}
      initialTasks={tasksWithFeatures}
      approvedDesigns={approvedDesigns}
      initialMessages={initialMessages}
    />
  )
}
