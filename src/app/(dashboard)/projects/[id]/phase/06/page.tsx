import { createClient } from '@/lib/supabase/server'
import { Phase06Layout } from '@/components/phase-06/Phase06Layout'
import { PlanGuard } from '@/components/shared/PlanGuard'
import { canAccessPhase } from '@/lib/plans/guards'
import { PHASE06_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-06'
import type { SectionStatus } from '@/types/conversation'

type CategoryData = {
  key: string
  label: string
  status: SectionStatus
}

export default async function Phase06Page({
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

  if (!profile || !canAccessPhase(6, profile)) {
    return (
      <PlanGuard hasAccess={false} currentPlan={profile?.plan ?? 'starter'} feature="Phase 06 — Launch & Deployment">
        <div />
      </PlanGuard>
    )
  }

  const { data: sections } = await supabase
    .from('phase_sections')
    .select('section, status')
    .eq('project_id', projectId)
    .eq('phase_number', 6)

  const categories: CategoryData[] = PHASE06_SECTIONS.map((key) => {
    const row = (sections ?? []).find((s) => s.section === key)
    return {
      key,
      label: SECTION_LABELS[key],
      status: (row?.status ?? 'pending') as SectionStatus,
    }
  })

  return <Phase06Layout projectId={projectId} categories={categories} />
}
