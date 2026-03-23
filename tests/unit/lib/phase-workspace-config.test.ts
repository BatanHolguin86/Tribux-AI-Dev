import { describe, it, expect } from 'vitest'
import { getPhaseAgents, getPhaseSectionAgents, phaseHasTools } from '@/lib/phase-workspace-config'
import type { AgentType } from '@/types/agent'

describe('getPhaseAgents', () => {
  it('always returns cto_virtual as first agent', () => {
    for (let phase = 0; phase <= 7; phase++) {
      const agents = getPhaseAgents(phase)
      expect(agents[0]).toBe('cto_virtual')
    }
  })

  it('returns no duplicates for any phase', () => {
    for (let phase = 0; phase <= 7; phase++) {
      const agents = getPhaseAgents(phase)
      const unique = [...new Set(agents)]
      expect(agents).toEqual(unique)
    }
  })

  it('includes product_architect for phase 0', () => {
    const agents = getPhaseAgents(0)
    expect(agents).toContain('product_architect')
  })

  it('includes ui_ux_designer for phase 2', () => {
    const agents = getPhaseAgents(2)
    expect(agents).toContain('ui_ux_designer')
  })

  it('includes devops_engineer for phase 3', () => {
    const agents = getPhaseAgents(3)
    expect(agents).toContain('devops_engineer')
  })

  it('includes lead_developer for phase 4', () => {
    const agents = getPhaseAgents(4)
    expect(agents).toContain('lead_developer')
  })

  it('returns empty-style array for unknown phase numbers', () => {
    const agents = getPhaseAgents(99)
    // Should still have CTO as fallback
    expect(agents[0]).toBe('cto_virtual')
  })
})

describe('getPhaseSectionAgents', () => {
  it('returns 5 sections for phase 0', () => {
    const sections = getPhaseSectionAgents(0)
    expect(sections).toHaveLength(5)
    expect(sections.map((s) => s.section)).toEqual([
      'problem_statement',
      'personas',
      'value_proposition',
      'metrics',
      'competitive_analysis',
    ])
  })

  it('returns 3 sections for phase 1', () => {
    const sections = getPhaseSectionAgents(1)
    expect(sections).toHaveLength(3)
    expect(sections.map((s) => s.section)).toEqual([
      'requirements',
      'design',
      'tasks',
    ])
  })

  it('returns 4 sections for phase 2', () => {
    const sections = getPhaseSectionAgents(2)
    expect(sections).toHaveLength(4)
    expect(sections.map((s) => s.section)).toEqual([
      'system_architecture',
      'database_design',
      'api_design',
      'architecture_decisions',
    ])
  })

  it('returns single "all" section for phases 3-7', () => {
    for (let phase = 3; phase <= 7; phase++) {
      const sections = getPhaseSectionAgents(phase)
      expect(sections).toHaveLength(1)
      expect(sections[0].section).toBe('all')
    }
  })

  it('phase 0 sections include correct agents per section', () => {
    const sections = getPhaseSectionAgents(0)
    const personas = sections.find((s) => s.section === 'personas')!
    expect(personas.agents).toContain('cto_virtual')
    expect(personas.agents).toContain('ui_ux_designer')
  })

  it('phase 2 sections include correct agents', () => {
    const sections = getPhaseSectionAgents(2)
    const dbDesign = sections.find((s) => s.section === 'database_design')!
    expect(dbDesign.agents).toContain('db_admin')
    expect(dbDesign.agents).toContain('cto_virtual')
  })

  it('every section has at least one agent', () => {
    for (let phase = 0; phase <= 7; phase++) {
      const sections = getPhaseSectionAgents(phase)
      for (const section of sections) {
        expect(section.agents.length).toBeGreaterThan(0)
      }
    }
  })

  it('every section has a non-empty label', () => {
    for (let phase = 0; phase <= 7; phase++) {
      const sections = getPhaseSectionAgents(phase)
      for (const section of sections) {
        expect(section.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('phases 3-7 always include cto_virtual in agents', () => {
    for (let phase = 3; phase <= 7; phase++) {
      const sections = getPhaseSectionAgents(phase)
      expect(sections[0].agents).toContain('cto_virtual')
    }
  })
})

describe('phaseHasTools', () => {
  it('returns true only for phase 2', () => {
    expect(phaseHasTools(2)).toBe(true)
  })

  it('returns false for all other phases', () => {
    for (const phase of [0, 1, 3, 4, 5, 6, 7]) {
      expect(phaseHasTools(phase)).toBe(false)
    }
  })
})
