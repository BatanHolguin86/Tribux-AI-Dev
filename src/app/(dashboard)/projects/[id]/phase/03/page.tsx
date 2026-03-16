import { createClient } from '@/lib/supabase/server'
import { Phase03Layout } from '@/components/phase-03/Phase03Layout'
import { PlanGuard } from '@/components/shared/PlanGuard'
import { canAccessPhase } from '@/lib/plans/guards'
import { PHASE03_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-03'
import type { SectionStatus } from '@/types/conversation'

type CategoryData = {
  key: string
  label: string
  status: SectionStatus
}

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
    .select('section, status')
    .eq('project_id', projectId)
    .eq('phase_number', 3)

  const categories: CategoryData[] = PHASE03_SECTIONS.map((key) => {
    const row = (sections ?? []).find((s) => s.section === key)
    return {
      key,
      label: SECTION_LABELS[key],
      status: (row?.status ?? 'pending') as SectionStatus,
    }
  })

  return <Phase03Layout projectId={projectId} categories={categories} />
}
