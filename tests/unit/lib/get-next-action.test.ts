import { describe, it, expect } from 'vitest'
import { getNextAction } from '@/lib/projects/get-next-action'

describe('getNextAction', () => {
  it('returns Discovery action for phase 0', () => {
    expect(getNextAction(0)).toBe('Completa el brief de Discovery')
  })

  it('returns Requirements action for phase 1', () => {
    expect(getNextAction(1)).toBe('Define y aprueba los specs KIRO de tus features')
  })

  it('returns Architecture action for phase 2', () => {
    expect(getNextAction(2)).toBe('Revisa la arquitectura del sistema')
  })

  it('returns Environment Setup action for phase 3', () => {
    expect(getNextAction(3)).toBe('Configura el entorno de desarrollo')
  })

  it('returns Core Development action for phase 4', () => {
    expect(getNextAction(4)).toBe('Supervisa el desarrollo de features')
  })

  it('returns QA action for phase 5', () => {
    expect(getNextAction(5)).toBe('Revisa los reportes de QA')
  })

  it('returns Deployment action for phase 6', () => {
    expect(getNextAction(6)).toBe('Aprueba el deploy a produccion')
  })

  it('returns Iteration action for phase 7', () => {
    expect(getNextAction(7)).toBe('Revisa metricas y feedback')
  })

  it('returns fallback with phase name for unknown phase numbers', () => {
    // Phase 99 does not exist in PHASE_NAMES, so it falls back to "Unknown"
    expect(getNextAction(99)).toBe('Continua con Unknown')
  })

  it('returns fallback for negative phase numbers', () => {
    expect(getNextAction(-1)).toBe('Continua con Unknown')
  })

  it('returns a non-empty string for all valid phases (0-7)', () => {
    for (let phase = 0; phase <= 7; phase++) {
      const action = getNextAction(phase)
      expect(action).toBeTruthy()
      expect(typeof action).toBe('string')
      expect(action.length).toBeGreaterThan(0)
    }
  })
})
