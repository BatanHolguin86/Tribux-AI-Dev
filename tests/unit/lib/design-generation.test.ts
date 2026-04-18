import { describe, it, expect } from 'vitest'

describe('design generation prompts', () => {
  it('module exports design functions', async () => {
    const mod = await import('@/lib/ai/prompts/design-generation')
    expect(mod).toBeDefined()
    // Should have at least one exported function
    const exports = Object.keys(mod)
    expect(exports.length).toBeGreaterThan(0)
  })
})
