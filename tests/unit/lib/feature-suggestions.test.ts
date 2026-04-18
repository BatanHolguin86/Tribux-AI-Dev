import { describe, it, expect } from 'vitest'

describe('feature suggestions module', () => {
  it('exports suggestion functions', async () => {
    const mod = await import('@/lib/ai/prompts/feature-suggestions')
    expect(mod).toBeDefined()
    const exports = Object.keys(mod)
    expect(exports.length).toBeGreaterThan(0)
  })
})
