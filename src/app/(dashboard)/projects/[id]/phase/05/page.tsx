import { createClient } from '@/lib/supabase/server'
import { Phase05Layout } from '@/components/phase-05/Phase05Layout'
import { PlanGuard } from '@/components/shared/PlanGuard'
import { canAccessPhase } from '@/lib/plans/guards'
import { PHASE05_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-05'
import type { SectionStatus } from '@/types/conversation'
import { parseItemStates, type PhaseChecklistCategory } from '@/lib/phase-checklist-sections'

export default async function Phase05Page({
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

  if (!profile || !canAccessPhase(5, profile)) {
    return (
      <PlanGuard hasAccess={false} currentPlan={profile?.plan ?? 'starter'} feature="Phase 05 — Testing & QA">
        <div />
      </PlanGuard>
    )
  }

  const { data: sections } = await supabase
    .from('phase_sections')
    .select('section, status, item_states')
    .eq('project_id', projectId)
    .eq('phase_number', 5)

  const categories: PhaseChecklistCategory[] = PHASE05_SECTIONS.map((key) => {
    const row = (sections ?? []).find((s) => s.section === key)
    return {
      key,
      label: SECTION_LABELS[key],
      status: (row?.status ?? 'pending') as SectionStatus,
      itemStates: parseItemStates(row?.item_states),
    }
  })

  return <Phase05Layout projectId={projectId} categories={categories} />
}
