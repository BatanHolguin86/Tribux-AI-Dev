import { createClient } from '@/lib/supabase/server'
import { Phase07Layout } from '@/components/phase-07/Phase07Layout'
import { PlanGuard } from '@/components/shared/PlanGuard'
import { canAccessPhase } from '@/lib/plans/guards'
import { PHASE07_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-07'
import type { SectionStatus } from '@/types/conversation'
import { parseItemStates, type PhaseChecklistCategory } from '@/lib/phase-checklist-sections'

export default async function Phase07Page({
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

  if (!profile || !canAccessPhase(7, profile)) {
    return (
      <PlanGuard hasAccess={false} currentPlan={profile?.plan ?? 'starter'} feature="Phase 07 — Iteration & Growth">
        <div />
      </PlanGuard>
    )
  }

  const { data: sections } = await supabase
    .from('phase_sections')
    .select('section, status, item_states')
    .eq('project_id', projectId)
    .eq('phase_number', 7)

  const categories: PhaseChecklistCategory[] = PHASE07_SECTIONS.map((key) => {
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
    .eq('phase_number', 7)
    .eq('section', 'all')
    .eq('agent_type', 'orchestrator')
    .maybeSingle()

  const initialMessages = (chatRow?.messages as Array<{ role: string; content: string; created_at?: string }>) ?? []

  return <Phase07Layout projectId={projectId} categories={categories} initialMessages={initialMessages} />
}
