import { describe, it, expect } from 'vitest'
import { SECTION_LABELS } from '@/lib/ai/prompts/phase-02'

describe('Phase 02 prompts', () => {
  it('SECTION_LABELS has 4 architecture sections', () => {
    const keys = Object.keys(SECTION_LABELS)
    expect(keys).toHaveLength(4)
    expect(keys).toContain('system_architecture')
    expect(keys).toContain('database_design')
    expect(keys).toContain('api_design')
    expect(keys).toContain('architecture_decisions')
  })

  it('each section label is a non-empty string', () => {
    for (const label of Object.values(SECTION_LABELS)) {
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(3)
    }
  })

  it('exports buildPhase02Prompt function', async () => {
    const mod = await import('@/lib/ai/prompts/phase-02')
    expect(typeof mod.buildPhase02Prompt).toBe('function')
  })
})
