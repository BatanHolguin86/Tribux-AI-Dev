import { describe, it, expect } from 'vitest'
import { computeCostForModel } from '@/lib/ai/usage'

describe('AI usage pricing table (cleaned up)', () => {
  it('has pricing for Claude Sonnet 4.6', () => {
    const cost = computeCostForModel('claude-sonnet-4-6', 1_000_000, 0)
    expect(cost).toBe(3) // $3/MTok input
  })

  it('has pricing for Claude Opus 4.6', () => {
    const cost = computeCostForModel('claude-opus-4-6', 1_000_000, 0)
    expect(cost).toBe(15) // $15/MTok input
  })

  it('has pricing for Claude Haiku 4.5', () => {
    const cost = computeCostForModel('claude-haiku-4-5', 1_000_000, 0)
    expect(cost).toBe(0.8) // $0.80/MTok input
  })

  it('falls back to Sonnet pricing for unknown models', () => {
    const cost = computeCostForModel('gpt-4o', 1_000_000, 0)
    expect(cost).toBe(3) // default = Sonnet pricing
  })

  it('falls back to Sonnet pricing for OpenAI models (removed)', () => {
    const cost = computeCostForModel('gpt-4o-mini', 1_000_000, 0)
    expect(cost).toBe(3) // not in table anymore, falls back
  })

  it('falls back to Sonnet pricing for Gemini models (removed)', () => {
    const cost = computeCostForModel('gemini-2.5-pro', 1_000_000, 0)
    expect(cost).toBe(3) // not in table anymore, falls back
  })

  it('computes combined input+output cost correctly', () => {
    // Sonnet: 1M input ($3) + 1M output ($15) = $18
    const cost = computeCostForModel('claude-sonnet-4-6', 1_000_000, 1_000_000)
    expect(cost).toBe(18)
  })

  it('handles legacy Claude 3.5 models', () => {
    const cost = computeCostForModel('claude-3-5-sonnet-20241022', 1_000_000, 0)
    expect(cost).toBe(3) // still in pricing table
  })
})
