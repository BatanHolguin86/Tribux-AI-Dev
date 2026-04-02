import { createClient } from '@/lib/supabase/server'
import { Phase03Layout } from '@/components/phase-03/Phase03Layout'
import { PlanGuard } from '@/components/shared/PlanGuard'
import { canAccessPhase } from '@/lib/plans/guards'
import { PHASE03_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-03'
import type { SectionStatus } from '@/types/conversation'
import { parseItemStates, type PhaseChecklistCategory } from '@/lib/phase-checklist-sections'
import type { ActionExecution } from '@/types/action'

export default async function Phase03Page({
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

  if (!profile || !canAccessPhase(3, profile)) {
    return (
      <PlanGuard hasAccess={false} currentPlan={profile?.plan ?? 'starter'} feature="Phase 03 — Environment Setup">
        <div />
      </PlanGuard>
    )
  }

  const { data: sections } = await supabase
    .from('phase_sections')
    .select('section, status, item_states')
    .eq('project_id', projectId)
    .eq('phase_number', 3)

  const categories: PhaseChecklistCategory[] = PHASE03_SECTIONS.map((key) => {
    const row = (sections ?? []).find((s) => s.section === key)
    return {
      key,
      label: SECTION_LABELS[key],
      status: (row?.status ?? 'pending') as SectionStatus,
      itemStates: parseItemStates(row?.item_states),
    }
  })

  // Fetch CTO chat messages for Herramientas tab
  const { data: chatRow } = await supabase
    .from('agent_conversations')
    .select('messages')
    .eq('project_id', projectId)
    .eq('phase_number', 3)
    .eq('section', 'all')
    .eq('agent_type', 'orchestrator')
    .maybeSingle()

  const initialMessages = (chatRow?.messages as Array<{ role: string; content: string; created_at?: string }>) ?? []

  const { data: executionsData } = await supabase
    .from('action_executions')
    .select('*')
    .eq('project_id', projectId)
    .eq('phase_number', 3)
    .order('created_at', { ascending: false })

  const initialExecutions = (executionsData ?? []) as ActionExecution[]

  // Check platform tokens for one-click setup
  const platformReady = !!(
    process.env.PLATFORM_GITHUB_TOKEN &&
    process.env.PLATFORM_SUPABASE_TOKEN &&
    process.env.PLATFORM_VERCEL_TOKEN
  )

  // Check existing setup status
  const { data: project } = await supabase
    .from('projects')
    .select('repo_url, supabase_project_ref, vercel_project_id')
    .eq('id', projectId)
    .eq('user_id', user!.id)
    .single()

  const existingSetup = {
    hasRepo: !!project?.repo_url,
    hasSupabase: !!project?.supabase_project_ref,
    hasVercel: !!project?.vercel_project_id,
  }

  return (
    <Phase03Layout
      projectId={projectId}
      categories={categories}
      initialMessages={initialMessages}
      initialExecutions={initialExecutions}
      platformReady={platformReady}
      existingSetup={existingSetup}
    />
  )
}
