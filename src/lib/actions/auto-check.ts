import { createAdminClient } from '@/lib/supabase/server'

/**
 * Auto-marks checklist items as completed after a successful action execution.
 * Uses admin client since this may be called from action endpoints.
 */
export async function autoCheckItems(
  projectId: string,
  phaseNumber: number,
  section: string,
  itemIndices: number[],
): Promise<void> {
  if (itemIndices.length === 0) return

  const supabase = await createAdminClient()

  const { data: row } = await supabase
    .from('phase_sections')
    .select('item_states, status')
    .eq('project_id', projectId)
    .eq('phase_number', phaseNumber)
    .eq('section', section)
    .single()

  if (!row) return

  const prev = (row.item_states as Record<string, boolean> | null) ?? {}
  const next = { ...prev }

  for (const idx of itemIndices) {
    next[String(idx)] = true
  }

  await supabase
    .from('phase_sections')
    .update({ item_states: next })
    .eq('project_id', projectId)
    .eq('phase_number', phaseNumber)
    .eq('section', section)
}
