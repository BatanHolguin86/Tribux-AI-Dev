import type { SectionStatus } from '@/types/conversation'
import { PHASE03_SECTIONS } from '@/lib/ai/prompts/phase-03'
import { PHASE05_SECTIONS } from '@/lib/ai/prompts/phase-05'
import { PHASE06_SECTIONS } from '@/lib/ai/prompts/phase-06'
import { PHASE07_SECTIONS } from '@/lib/ai/prompts/phase-07'

export type PhaseChecklistCategory = {
  key: string
  label: string
  status: SectionStatus
  itemStates: Record<number, boolean>
}

/** Phases that use persisted section checklists + per-item item_states */
export const CHECKLIST_PHASE_NUMBERS = [3, 5, 6, 7] as const
export type ChecklistPhaseNumber = (typeof CHECKLIST_PHASE_NUMBERS)[number]

const SECTIONS_BY_PHASE: Record<ChecklistPhaseNumber, readonly string[]> = {
  3: PHASE03_SECTIONS,
  5: PHASE05_SECTIONS,
  6: PHASE06_SECTIONS,
  7: PHASE07_SECTIONS,
}

export function isChecklistPhase(phase: number): phase is ChecklistPhaseNumber {
  return (CHECKLIST_PHASE_NUMBERS as readonly number[]).includes(phase)
}

export function isAllowedSectionForPhase(phase: number, section: string): boolean {
  if (!isChecklistPhase(phase)) return false
  return SECTIONS_BY_PHASE[phase].includes(section)
}

/** Normalize JSONB item_states from DB to numeric keys */
export function parseItemStates(raw: unknown): Record<number, boolean> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<number, boolean> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const i = Number.parseInt(k, 10)
    if (Number.isFinite(i) && typeof v === 'boolean') {
      out[i] = v
    }
  }
  return out
}
