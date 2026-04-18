import { describe, it, expect } from 'vitest'
import {
  computeCostForModel,
  computeCostFromTokens,
  estimateTokensFromText,
  AI_USAGE_EVENT_TYPES,
} from '@/lib/ai/usage'

describe('computeCostForModel — all models', () => {
  it('claude-sonnet-4-6: $3 input, $15 output per MTok', () => {
    expect(computeCostForModel('claude-sonnet-4-6', 1_000_000, 0)).toBe(3)
    expect(computeCostForModel('claude-sonnet-4-6', 0, 1_000_000)).toBe(15)
  })

  it('claude-opus-4-6: $15 input, $75 output per MTok', () => {
    expect(computeCostForModel('claude-opus-4-6', 1_000_000, 0)).toBe(15)
    expect(computeCostForModel('claude-opus-4-6', 0, 1_000_000)).toBe(75)
  })

  it('claude-haiku-4-5: $0.80 input, $4 output per MTok', () => {
    expect(computeCostForModel('claude-haiku-4-5', 1_000_000, 0)).toBe(0.8)
    expect(computeCostForModel('claude-haiku-4-5', 0, 1_000_000)).toBe(4)
  })

  it('legacy claude-3-5-sonnet: same as Sonnet pricing', () => {
    expect(computeCostForModel('claude-3-5-sonnet-20241022', 1_000_000, 0)).toBe(3)
  })

  it('unknown model falls back to Sonnet pricing', () => {
    expect(computeCostForModel('unknown-model', 1_000_000, 0)).toBe(3)
    expect(computeCostForModel(null, 1_000_000, 0)).toBe(3)
    expect(computeCostForModel(undefined, 1_000_000, 0)).toBe(3)
  })

  it('zero tokens = zero cost', () => {
    expect(computeCostForModel('claude-sonnet-4-6', 0, 0)).toBe(0)
  })

  it('combined input+output', () => {
    // Sonnet: 500K input ($1.5) + 200K output ($3) = $4.5
    const cost = computeCostForModel('claude-sonnet-4-6', 500_000, 200_000)
    expect(cost).toBe(4.5)
  })
})

describe('estimateTokensFromText', () => {
  it('estimates ~4 chars per token', () => {
    expect(estimateTokensFromText('hello world')).toBe(3) // 11 chars / 4 ≈ 3
  })

  it('returns 0 for empty string', () => {
    expect(estimateTokensFromText('')).toBe(0)
  })

  it('handles long text', () => {
    const text = 'a'.repeat(4000)
    expect(estimateTokensFromText(text)).toBe(1000)
  })
})

describe('AI_USAGE_EVENT_TYPES', () => {
  it('has 37 event types', () => {
    expect(AI_USAGE_EVENT_TYPES.length).toBeGreaterThanOrEqual(30)
  })

  it('includes agent_chat', () => {
    expect(AI_USAGE_EVENT_TYPES).toContain('agent_chat')
  })

  it('includes all phase chats', () => {
    for (let i = 0; i <= 7; i++) {
      expect(AI_USAGE_EVENT_TYPES).toContain(`phase0${i}_chat`)
    }
  })

  it('includes design events', () => {
    expect(AI_USAGE_EVENT_TYPES).toContain('design_generate')
    expect(AI_USAGE_EVENT_TYPES).toContain('design_refine')
  })

  it('includes action events', () => {
    expect(AI_USAGE_EVENT_TYPES).toContain('action_scaffold_project')
    expect(AI_USAGE_EVENT_TYPES).toContain('action_auto_build_task')
    expect(AI_USAGE_EVENT_TYPES).toContain('action_generate_qa_report')
  })
})

describe('computeCostFromTokens (deprecated)', () => {
  it('uses Sonnet pricing as default', () => {
    expect(computeCostFromTokens(1_000_000, 0)).toBe(3)
    expect(computeCostFromTokens(0, 1_000_000)).toBe(15)
  })
})
