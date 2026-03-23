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

/**
 * Section-level agent mapping per phase.
 * Used by PhaseTeamPanel to show which agents work on which sections.
 */
export type SectionAgentMapping = {
  section: string
  label: string
  agents: AgentType[]
}

export function getPhaseSectionAgents(phaseNumber: number): SectionAgentMapping[] {
  if (phaseNumber === 0) {
    return [
      { section: 'problem_statement', label: 'Problem Statement', agents: PHASE_00_AGENTS.problem_statement },
      { section: 'personas', label: 'User Personas', agents: PHASE_00_AGENTS.personas },
      { section: 'value_proposition', label: 'Value Proposition', agents: PHASE_00_AGENTS.value_proposition },
      { section: 'metrics', label: 'Success Metrics', agents: PHASE_00_AGENTS.metrics },
      { section: 'competitive_analysis', label: 'Competitive Analysis', agents: PHASE_00_AGENTS.competitive_analysis },
    ]
  }

  if (phaseNumber === 1) {
    return [
      { section: 'requirements', label: 'Requirements', agents: PHASE_01_AGENTS.requirements },
      { section: 'design', label: 'Design', agents: PHASE_01_AGENTS.design },
      { section: 'tasks', label: 'Tasks', agents: PHASE_01_AGENTS.tasks },
    ]
  }

  if (phaseNumber === 2) {
    return [
      { section: 'system_architecture', label: 'System Architecture', agents: PHASE_02_AGENTS.system_architecture },
      { section: 'database_design', label: 'Database Design', agents: PHASE_02_AGENTS.database_design },
      { section: 'api_design', label: 'API Design', agents: PHASE_02_AGENTS.api_design },
      { section: 'architecture_decisions', label: 'Architecture Decisions', agents: PHASE_02_AGENTS.architecture_decisions },
    ]
  }

  // Phases 03-07: single group (all agents work on all sections via CTO orchestration)
  const phaseAgents = PHASE_03_07_AGENTS[phaseNumber] ?? []
  const allAgents: AgentType[] = ['cto_virtual', ...phaseAgents]

  const phaseLabels: Record<number, string> = {
    3: 'Environment Setup',
    4: 'Core Development',
    5: 'Testing & QA',
    6: 'Launch & Deployment',
    7: 'Iteration & Growth',
  }

  return [
    { section: 'all', label: phaseLabels[phaseNumber] ?? `Phase ${phaseNumber}`, agents: allAgents },
  ]
}
