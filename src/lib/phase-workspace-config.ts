import type { AgentType } from '@/types/agent'
import {
  PHASE_00_AGENTS,
  PHASE_01_AGENTS,
  PHASE_02_AGENTS,
  PHASE_03_07_AGENTS,
} from '@/lib/ai/agents/phase-agents'

/**
 * Returns deduplicated list of agents for a given phase number.
 * CTO Virtual is always included and always first.
 */
export function getPhaseAgents(phaseNumber: number): AgentType[] {
  let agents: AgentType[] = []

  if (phaseNumber === 0) {
    const all = Object.values(PHASE_00_AGENTS).flat()
    agents = [...new Set(all)]
  } else if (phaseNumber === 1) {
    const all = Object.values(PHASE_01_AGENTS).flat()
    agents = [...new Set(all)]
  } else if (phaseNumber === 2) {
    const all = Object.values(PHASE_02_AGENTS).flat()
    // Add UI/UX Designer for the design tools tab
    agents = [...new Set([...all, 'ui_ux_designer' as AgentType])]
  } else if (phaseNumber >= 3 && phaseNumber <= 7) {
    const phaseAgents = PHASE_03_07_AGENTS[phaseNumber] ?? []
    agents = [...new Set(['cto_virtual' as AgentType, ...phaseAgents])]
  }

  // Ensure CTO is always first
  const withoutCto = agents.filter((a) => a !== 'cto_virtual')
  return ['cto_virtual', ...withoutCto]
}

/**
 * Phases that have a "Herramientas" tab.
 * Phase 02 has the Design Hub.
 */
export function phaseHasTools(phaseNumber: number): boolean {
  return phaseNumber === 2
}
