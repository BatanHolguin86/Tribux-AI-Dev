import { createClient } from '@/lib/supabase/server'
import { Phase06Layout } from '@/components/phase-06/Phase06Layout'
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
