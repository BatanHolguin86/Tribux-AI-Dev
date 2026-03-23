import { describe, it, expect, vi } from 'vitest'
import {
  computeCostFromTokens,
  estimateTokensFromText,
  recordAiUsage,
  AI_USAGE_EVENT_TYPES,
} from '@/lib/ai/usage'

describe('computeCostFromTokens', () => {
  it('returns 0 for zero tokens', () => {
    expect(computeCostFromTokens(0, 0)).toBe(0)
  })

  it('computes correct cost for input-only tokens', () => {
    // 1M input tokens at $3/Mtok = $3.00
    expect(computeCostFromTokens(1_000_000, 0)).toBe(3)
  })

  it('computes correct cost for output-only tokens', () => {
    // 1M output tokens at $15/Mtok = $15.00
    expect(computeCostFromTokens(0, 1_000_000)).toBe(15)
  })

  it('computes correct cost for small amounts', () => {
    // 100 input tokens = 100/1M * 3 = 0.0003
    // 50 output tokens = 50/1M * 15 = 0.00075
    // total = 0.00105
    const cost = computeCostFromTokens(100, 50)
    expect(cost).toBeCloseTo(0.00105, 6)
  })

  it('computes correct cost for large amounts', () => {
    // 10M input tokens = 10 * 3 = 30
    // 5M output tokens = 5 * 15 = 75
    // total = 105
    expect(computeCostFromTokens(10_000_000, 5_000_000)).toBe(105)
  })

  it('rounds to 6 decimal places to avoid floating-point noise', () => {
    // 1 input token = 1/1M * 3 = 0.000003
    const cost = computeCostFromTokens(1, 0)
    expect(cost).toBe(0.000003)
  })

  it('computes combined input and output cost correctly', () => {
    // 500 input = 500/1M * 3 = 0.0015
    // 200 output = 200/1M * 15 = 0.003
    // total = 0.0045
    expect(computeCostFromTokens(500, 200)).toBe(0.0045)
  })
})

describe('estimateTokensFromText', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokensFromText('')).toBe(0)
  })

  it('returns 0 for falsy input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(estimateTokensFromText(undefined as any)).toBe(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(estimateTokensFromText(null as any)).toBe(0)
  })

  it('estimates tokens for short text (rounds up)', () => {
    // "hello" = 5 chars => ceil(5/4) = 2
    expect(estimateTokensFromText('hello')).toBe(2)
  })

  it('estimates tokens for text divisible by 4', () => {
    // "abcd" = 4 chars => ceil(4/4) = 1
    expect(estimateTokensFromText('abcd')).toBe(1)
  })

  it('estimates tokens for long text', () => {
    const longText = 'a'.repeat(1000)
    // 1000 chars => ceil(1000/4) = 250
    expect(estimateTokensFromText(longText)).toBe(250)
  })

  it('estimates tokens for single character', () => {
    // 1 char => ceil(1/4) = 1
    expect(estimateTokensFromText('x')).toBe(1)
  })
})

describe('AI_USAGE_EVENT_TYPES', () => {
  it('is a non-empty array', () => {
    expect(AI_USAGE_EVENT_TYPES.length).toBeGreaterThan(0)
  })

  it('contains expected event types', () => {
    expect(AI_USAGE_EVENT_TYPES).toContain('agent_chat')
    expect(AI_USAGE_EVENT_TYPES).toContain('phase00_chat')
    expect(AI_USAGE_EVENT_TYPES).toContain('phase01_generate')
    expect(AI_USAGE_EVENT_TYPES).toContain('design_generate')
    expect(AI_USAGE_EVENT_TYPES).toContain('design_refine')
    expect(AI_USAGE_EVENT_TYPES).toContain('thread_title')
    expect(AI_USAGE_EVENT_TYPES).toContain('suggestions')
  })

  it('has the correct number of event types', () => {
    expect(AI_USAGE_EVENT_TYPES).toHaveLength(18)
  })

  it('contains all phase chat types', () => {
    for (let i = 0; i <= 7; i++) {
      expect(AI_USAGE_EVENT_TYPES).toContain(`phase0${i}_chat`)
    }
  })
})

describe('recordAiUsage', () => {
  function createMockSupabase() {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const fromMock = vi.fn().mockReturnValue({ insert: insertMock })
    return {
      supabase: { from: fromMock } as unknown as Parameters<typeof recordAiUsage>[0],
      fromMock,
      insertMock,
    }
  }

  it('calls supabase.from("ai_usage_events").insert() with correct params', async () => {
    const { supabase, fromMock, insertMock } = createMockSupabase()

    await recordAiUsage(supabase, {
      userId: 'user-123',
      projectId: 'proj-456',
      eventType: 'agent_chat',
      model: 'claude-sonnet-4',
      inputTokens: 1000,
      outputTokens: 500,
    })

    expect(fromMock).toHaveBeenCalledWith('ai_usage_events')
    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user-123',
      project_id: 'proj-456',
      event_type: 'agent_chat',
      model: 'claude-sonnet-4',
      input_tokens: 1000,
      output_tokens: 500,
      estimated_cost_usd: computeCostFromTokens(1000, 500),
    })
  })

  it('defaults projectId to null when not provided', async () => {
    const { supabase, insertMock } = createMockSupabase()

    await recordAiUsage(supabase, {
      userId: 'user-123',
      eventType: 'thread_title',
      inputTokens: 100,
      outputTokens: 50,
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: null,
      }),
    )
  })

  it('defaults model to null when not provided', async () => {
    const { supabase, insertMock } = createMockSupabase()

    await recordAiUsage(supabase, {
      userId: 'user-123',
      eventType: 'suggestions',
      inputTokens: 200,
      outputTokens: 100,
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: null,
      }),
    )
  })

  it('computes estimated_cost_usd from token counts', async () => {
    const { supabase, insertMock } = createMockSupabase()

    await recordAiUsage(supabase, {
      userId: 'user-1',
      eventType: 'phase00_chat',
      inputTokens: 2000,
      outputTokens: 1000,
    })

    const expectedCost = computeCostFromTokens(2000, 1000)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        estimated_cost_usd: expectedCost,
      }),
    )
  })
})
