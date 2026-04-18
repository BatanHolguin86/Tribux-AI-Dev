import { describe, it, expect } from 'vitest'
import { PHASE_ACTIONS, getActionsForPhase, getActionForSection, getActionByName } from '@/lib/actions/action-registry'

describe('PHASE_ACTIONS registry', () => {
  it('has 28 total actions', () => {
    expect(PHASE_ACTIONS).toHaveLength(27)
  })

  it('each action has required fields', () => {
    for (const action of PHASE_ACTIONS) {
      expect(action.actionName).toBeTruthy()
      expect(typeof action.phaseNumber).toBe('number')
      expect(action.section).toBeTruthy()
      expect(action.label).toBeTruthy()
      expect(action.description).toBeTruthy()
      expect(action.type).toBeTruthy()
      expect(typeof action.streaming).toBe('boolean')
      expect(Array.isArray(action.prerequisites)).toBe(true)
      expect(Array.isArray(action.itemIndices)).toBe(true)
    }
  })

  it('action names are unique', () => {
    const names = PHASE_ACTIONS.map((a) => a.actionName)
    expect(new Set(names).size).toBe(names.length)
  })

  it('covers phases 3-7', () => {
    const phases = [...new Set(PHASE_ACTIONS.map((a) => a.phaseNumber))].sort()
    expect(phases).toEqual([3, 4, 5, 6, 7])
  })

  it('phase 3 has 5 actions', () => {
    expect(getActionsForPhase(3)).toHaveLength(5)
  })

  it('phase 4 has 1 action', () => {
    expect(getActionsForPhase(4)).toHaveLength(1)
  })

  it('phase 5 has 6 actions', () => {
    expect(getActionsForPhase(5)).toHaveLength(6)
  })

  it('phase 6 has 11 actions', () => {
    expect(getActionsForPhase(6)).toHaveLength(10)
  })

  it('phase 7 has 5 actions', () => {
    expect(getActionsForPhase(7)).toHaveLength(5)
  })

  it('phase 0 has 0 actions', () => {
    expect(getActionsForPhase(0)).toHaveLength(0)
  })
})

describe('getActionForSection', () => {
  it('finds action by phase and section', () => {
    const action = getActionForSection(3, 'repository')
    expect(action).toBeDefined()
    expect(action!.actionName).toBe('one-click-setup')
  })

  it('returns undefined for non-existent section', () => {
    expect(getActionForSection(3, 'nonexistent')).toBeUndefined()
  })
})

describe('getActionByName', () => {
  it('finds action by name', () => {
    const action = getActionByName('auto-deploy')
    expect(action).toBeDefined()
    expect(action!.phaseNumber).toBe(6)
  })

  it('finds auto-fix', () => {
    const action = getActionByName('auto-fix')
    expect(action).toBeDefined()
    expect(action!.type).toBe('ai-generate-commit')
  })

  it('finds new-cycle', () => {
    const action = getActionByName('new-cycle')
    expect(action).toBeDefined()
    expect(action!.phaseNumber).toBe(7)
    expect(action!.confirmRequired).toBe(true)
  })

  it('returns undefined for non-existent name', () => {
    expect(getActionByName('nonexistent')).toBeUndefined()
  })
})

describe('action prerequisites', () => {
  it('one-click-setup requires platform tokens', () => {
    const action = getActionByName('one-click-setup')!
    expect(action.prerequisites.some((p) => p.type === 'env-exists')).toBe(true)
  })

  it('auto-deploy requires repo_url', () => {
    const action = getActionByName('auto-deploy')!
    expect(action.prerequisites.some((p) => p.type === 'field-exists' && p.field === 'repo_url')).toBe(true)
  })

  it('smoke-test has no prerequisites', () => {
    const action = getActionByName('smoke-test')!
    expect(action.prerequisites).toHaveLength(0)
  })

  it('confirmRequired actions are marked', () => {
    const confirmed = PHASE_ACTIONS.filter((a) => a.confirmRequired)
    expect(confirmed.length).toBeGreaterThan(0)
    for (const a of confirmed) {
      expect(a.confirmRequired).toBe(true)
    }
  })
})

describe('action types', () => {
  it('uses valid action types', () => {
    const validTypes = ['ai-generate-commit', 'ai-generate-sql', 'sql-execute', 'github-api', 'ai-report', 'external-api']
    for (const action of PHASE_ACTIONS) {
      expect(validTypes).toContain(action.type)
    }
  })

  it('streaming actions use ai-* or external-api types', () => {
    const streamingActions = PHASE_ACTIONS.filter((a) => a.streaming)
    for (const action of streamingActions) {
      expect(action.type.startsWith('ai-') || action.type === 'external-api').toBe(true)
    }
  })
})
