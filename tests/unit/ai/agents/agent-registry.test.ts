import { describe, it, expect } from 'vitest'
import { AGENTS, AGENT_MAP, isAgentAccessible } from '@/lib/ai/agents/index'
import type { AgentMeta } from '@/lib/ai/agents/index'
import type { AgentType } from '@/types/agent'
import type { Plan } from '@/types/user'
import { PHASE_00_AGENTS, PHASE_01_AGENTS, PHASE_02_AGENTS } from '@/lib/ai/agents/phase-agents'
import { CTO_VIRTUAL_PROMPT } from '@/lib/ai/agents/cto-virtual'
import { PRODUCT_ARCHITECT_PROMPT } from '@/lib/ai/agents/product-architect'
import { SYSTEM_ARCHITECT_PROMPT } from '@/lib/ai/agents/system-architect'
import { UI_UX_DESIGNER_PROMPT } from '@/lib/ai/agents/ui-ux-designer'
import { LEAD_DEVELOPER_PROMPT } from '@/lib/ai/agents/lead-developer'
import { DB_ADMIN_PROMPT } from '@/lib/ai/agents/db-admin'
import { QA_ENGINEER_PROMPT } from '@/lib/ai/agents/qa-engineer'
import { DEVOPS_ENGINEER_PROMPT } from '@/lib/ai/agents/devops-engineer'
import { OPERATOR_PROMPT } from '@/lib/ai/agents/operator'
import { DESIGN_TEMPLATES } from '@/lib/ai/agents/ui-ux-designer'
import type { DesignTemplate } from '@/lib/ai/agents/ui-ux-designer'

// 8 visible agents — operator was merged into devops_engineer
const EXPECTED_AGENT_IDS: AgentType[] = [
  'cto_virtual',
  'product_architect',
  'system_architect',
  'ui_ux_designer',
  'lead_developer',
  'db_admin',
  'qa_engineer',
  'devops_engineer',
]

const AGENT_PROMPTS: Record<string, string> = {
  cto_virtual: CTO_VIRTUAL_PROMPT,
  product_architect: PRODUCT_ARCHITECT_PROMPT,
  system_architect: SYSTEM_ARCHITECT_PROMPT,
  ui_ux_designer: UI_UX_DESIGNER_PROMPT,
  lead_developer: LEAD_DEVELOPER_PROMPT,
  db_admin: DB_ADMIN_PROMPT,
  qa_engineer: QA_ENGINEER_PROMPT,
  devops_engineer: DEVOPS_ENGINEER_PROMPT,
  operator: OPERATOR_PROMPT,
}

describe('AGENTS registry', () => {
  it('contains exactly 8 visible agents', () => {
    expect(AGENTS).toHaveLength(8)
  })

  it('includes all expected agent IDs', () => {
    const ids = AGENTS.map((a) => a.id)
    for (const expectedId of EXPECTED_AGENT_IDS) {
      expect(ids).toContain(expectedId)
    }
  })

  it.each(AGENTS)('agent "$name" has all required fields', (agent: AgentMeta) => {
    expect(agent.id).toBeTruthy()
    expect(typeof agent.id).toBe('string')
    expect(agent.name).toBeTruthy()
    expect(typeof agent.name).toBe('string')
    expect(agent.icon).toBeTruthy()
    expect(agent.specialty).toBeTruthy()
    expect(typeof agent.specialty).toBe('string')
    expect(agent.description).toBeTruthy()
    expect(typeof agent.description).toBe('string')
    expect(agent.planRequired).toBeTruthy()
    expect(['starter', 'builder', 'agency', 'enterprise']).toContain(agent.planRequired)
  })

  it('each agent has a non-empty icon', () => {
    for (const agent of AGENTS) {
      expect(agent.icon.length).toBeGreaterThan(0)
    }
  })

  it('CTO Virtual requires starter plan', () => {
    const cto = AGENTS.find((a) => a.id === 'cto_virtual')
    expect(cto).toBeDefined()
    expect(cto!.planRequired).toBe('starter')
  })

  it('operator alias maps to devops via AGENT_MAP', () => {
    // operator was merged into devops_engineer — backward compat via AGENT_MAP
    expect(AGENT_MAP['operator']).toBeDefined()
    expect(AGENT_MAP['operator'].id).toBe('operator')
  })

  it('specialist agents require builder plan', () => {
    const builderAgents: AgentType[] = [
      'product_architect',
      'system_architect',
      'ui_ux_designer',
      'lead_developer',
      'db_admin',
      'qa_engineer',
      'devops_engineer',
    ]
    for (const id of builderAgents) {
      const agent = AGENTS.find((a) => a.id === id)
      expect(agent).toBeDefined()
      expect(agent!.planRequired).toBe('builder')
    }
  })
})

describe('AGENT_MAP', () => {
  it('is a record keyed by AgentType', () => {
    for (const id of EXPECTED_AGENT_IDS) {
      expect(AGENT_MAP[id]).toBeDefined()
      expect(AGENT_MAP[id].id).toBe(id)
    }
  })

  it('maps every AGENTS entry by id', () => {
    for (const agent of AGENTS) {
      expect(AGENT_MAP[agent.id]).toEqual(agent)
    }
  })

  it('has AGENTS.length + 1 entries (includes operator alias)', () => {
    expect(Object.keys(AGENT_MAP)).toHaveLength(AGENTS.length + 1)
  })
})

describe('isAgentAccessible', () => {
  it('starter user can access starter agents', () => {
    expect(isAgentAccessible('starter', 'starter')).toBe(true)
  })

  it('starter user cannot access builder agents', () => {
    expect(isAgentAccessible('builder', 'starter')).toBe(false)
  })

  it('starter user cannot access agency agents', () => {
    expect(isAgentAccessible('agency', 'starter')).toBe(false)
  })

  it('builder user can access starter and builder agents', () => {
    expect(isAgentAccessible('starter', 'builder')).toBe(true)
    expect(isAgentAccessible('builder', 'builder')).toBe(true)
  })

  it('builder user cannot access agency agents', () => {
    expect(isAgentAccessible('agency', 'builder')).toBe(false)
  })

  it('agency user can access starter, builder, and agency agents', () => {
    expect(isAgentAccessible('starter', 'agency')).toBe(true)
    expect(isAgentAccessible('builder', 'agency')).toBe(true)
    expect(isAgentAccessible('agency', 'agency')).toBe(true)
  })

  it('agency user cannot access enterprise agents', () => {
    expect(isAgentAccessible('enterprise', 'agency')).toBe(false)
  })

  it('enterprise user can access all agent tiers', () => {
    const plans: Plan[] = ['starter', 'builder', 'agency', 'enterprise']
    for (const plan of plans) {
      expect(isAgentAccessible(plan, 'enterprise')).toBe(true)
    }
  })
})

describe('agent prompts are exported and non-empty', () => {
  it.each(EXPECTED_AGENT_IDS)('agent %s has a non-empty system prompt', (agentId) => {
    const prompt = AGENT_PROMPTS[agentId]
    expect(prompt).toBeDefined()
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('each agent prompt starts with ROL:', () => {
    for (const agentId of EXPECTED_AGENT_IDS) {
      const prompt = AGENT_PROMPTS[agentId]
      expect(prompt).toMatch(/^ROL:/)
    }
  })
})

describe('phase-agents mappings', () => {
  it('PHASE_00_AGENTS covers all Phase00 sections', () => {
    const sections = Object.keys(PHASE_00_AGENTS)
    expect(sections).toContain('problem_statement')
    expect(sections).toContain('personas')
    expect(sections).toContain('value_proposition')
    expect(sections).toContain('metrics')
    expect(sections).toContain('competitive_analysis')
    expect(sections).toHaveLength(5)
  })

  it('PHASE_01_AGENTS covers all KiroDocumentType sections', () => {
    const sections = Object.keys(PHASE_01_AGENTS)
    expect(sections).toContain('requirements')
    expect(sections).toContain('design')
    expect(sections).toContain('tasks')
    expect(sections).toHaveLength(3)
  })

  it('PHASE_02_AGENTS covers all Phase02 sections', () => {
    const sections = Object.keys(PHASE_02_AGENTS)
    expect(sections).toContain('system_architecture')
    expect(sections).toContain('database_design')
    expect(sections).toContain('api_design')
    expect(sections).toContain('architecture_decisions')
    expect(sections).toHaveLength(4)
  })

  it('CTO Virtual is always listed first in every phase agent mapping', () => {
    for (const agents of Object.values(PHASE_00_AGENTS)) {
      expect(agents[0]).toBe('cto_virtual')
    }
    for (const agents of Object.values(PHASE_01_AGENTS)) {
      expect(agents[0]).toBe('cto_virtual')
    }
    for (const agents of Object.values(PHASE_02_AGENTS)) {
      expect(agents[0]).toBe('cto_virtual')
    }
  })

  it('every agent referenced in phase mappings is a valid AgentType', () => {
    const allReferenced = [
      ...Object.values(PHASE_00_AGENTS).flat(),
      ...Object.values(PHASE_01_AGENTS).flat(),
      ...Object.values(PHASE_02_AGENTS).flat(),
    ]
    for (const agentId of allReferenced) {
      expect(EXPECTED_AGENT_IDS).toContain(agentId)
    }
  })

  it('each phase section has at least 2 agents', () => {
    for (const agents of Object.values(PHASE_00_AGENTS)) {
      expect(agents.length).toBeGreaterThanOrEqual(2)
    }
    for (const agents of Object.values(PHASE_01_AGENTS)) {
      expect(agents.length).toBeGreaterThanOrEqual(2)
    }
    for (const agents of Object.values(PHASE_02_AGENTS)) {
      expect(agents.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('DESIGN_TEMPLATES', () => {
  it('exports an array of design templates', () => {
    expect(Array.isArray(DESIGN_TEMPLATES)).toBe(true)
    expect(DESIGN_TEMPLATES.length).toBeGreaterThan(0)
  })

  it.each(DESIGN_TEMPLATES)(
    'template "$title" has all required fields',
    (template: DesignTemplate) => {
      expect(template.id).toBeTruthy()
      expect(template.title).toBeTruthy()
      expect(template.description).toBeTruthy()
      expect(template.icon).toBeTruthy()
      expect(template.prompt).toBeTruthy()
      expect(template.prompt.length).toBeGreaterThan(20)
    }
  )

  it('template ids are unique', () => {
    const ids = DESIGN_TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes wireframes, component-library, and style-guide templates', () => {
    const ids = DESIGN_TEMPLATES.map((t) => t.id)
    expect(ids).toContain('wireframes')
    expect(ids).toContain('component-library')
    expect(ids).toContain('style-guide')
  })
})
