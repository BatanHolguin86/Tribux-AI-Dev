import { describe, it, expect } from 'vitest'
import {
  AGENT_PHASE_SPECIALIZATION,
  getAgentPhaseSpecializationBlock,
} from '@/lib/ai/agents/agent-phase-specialization'
import type { AgentType } from '@/types/agent'

const AGENTS: AgentType[] = [
  'cto_virtual',
  'product_architect',
  'system_architect',
  'ui_ux_designer',
  'lead_developer',
  'db_admin',
  'qa_engineer',
  'devops_engineer',
  'operator',
]

describe('agent-phase-specialization', () => {
  it('defines priority/deliverables/quality for every agent and phase 0–7', () => {
    for (const agent of AGENTS) {
      for (let phase = 0; phase <= 7; phase++) {
        const text = AGENT_PHASE_SPECIALIZATION[agent][phase as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7]
        expect(text.length).toBeGreaterThan(20)
        expect(text).toMatch(/\*\*Prioridad:\*\*/)
        expect(text).toMatch(/\*\*Entregables:\*\*/)
        expect(text).toMatch(/\*\*Calidad:\*\*/)
      }
    }
  })

  it('returns empty for invalid phase', () => {
    expect(getAgentPhaseSpecializationBlock('cto_virtual', -1)).toBe('')
    expect(getAgentPhaseSpecializationBlock('cto_virtual', 8)).toBe('')
    expect(getAgentPhaseSpecializationBlock('cto_virtual', 1.5)).toBe('')
  })

  it('formats block with phase header', () => {
    const b = getAgentPhaseSpecializationBlock('qa_engineer', 5)
    expect(b).toContain('### Especialización IA DLC — Phase 05')
    expect(b).toMatch(/unit|integration|E2E/i)
  })
})
