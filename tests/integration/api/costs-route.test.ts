/**
 * Integration tests: GET /api/projects/[id]/costs — AI cost summary for project dashboard.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const projectId = 'proj-cost-1'
const userId = 'user-cost-1'

function buildAdminFrom() {
  return vi.fn((table: string) => {
    if (table === 'ai_usage_events') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(function (this: unknown, ...args: unknown[]) {
            const chain = {
              eq: vi.fn().mockReturnThis(),
              gte: vi.fn().mockReturnThis(),
              lt: vi.fn().mockResolvedValue({ data: [], error: null }),
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    estimated_cost_usd: 0.01,
                    event_type: 'agent_chat',
                    input_tokens: 100,
                    output_tokens: 50,
                    created_at: '2026-04-01T12:00:00.000Z',
                  },
                ],
                error: null,
              }),
            }
            if (args[0] === 'project_id') {
              return chain
            }
            if (args[0] === 'user_id') {
              return chain
            }
            return chain
          }),
        }),
      }
    }
    if (table === 'user_profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { plan: 'builder' }, error: null }),
          }),
        }),
      }
    }
    if (table === 'plan_cost_targets') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { monthly_ai_budget_usd: 50, plan_price_usd: 29 },
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'overage_ledger') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      }
    }
    return {}
  })
}

function buildUserFrom() {
  let projectsCalls = 0
  return vi.fn((table: string) => {
    if (table === 'projects') {
      projectsCalls += 1
      if (projectsCalls === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: projectId,
                    name: 'P',
                    created_at: '2026-01-01T00:00:00Z',
                    infra_tiers: {},
                    user_id: userId,
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: projectId, name: 'P' }],
            error: null,
          }),
        }),
      }
    }
    return {}
  })
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

describe('GET /api/projects/[id]/costs', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
      },
      from: buildUserFrom(),
    } as never)
    vi.mocked(createAdminClient).mockResolvedValue({
      from: buildAdminFrom(),
    } as never)
  })

  it('returns 401 when not authenticated', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
    } as never)

    const { GET } = await import('@/app/api/projects/[id]/costs/route')
    const res = await GET(new Request('http://x'), { params: Promise.resolve({ id: projectId }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when project not found or not owned', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      })),
    } as never)

    const { GET } = await import('@/app/api/projects/[id]/costs/route')
    const res = await GET(new Request('http://x'), { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('not_found')
  })

  it('returns 200 with CostSummary shape when data loads', async () => {
    const { GET } = await import('@/app/api/projects/[id]/costs/route')
    const res = await GET(new Request('http://x'), { params: Promise.resolve({ id: projectId }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      plan: 'builder',
      planBudgetUsd: 50,
      planPriceUsd: 29,
      totalEventCount: 1,
      totalInputTokens: 100,
      totalOutputTokens: 50,
    })
    expect(typeof body.aiCostAllTime).toBe('number')
    expect(Array.isArray(body.byCategory)).toBe(true)
    expect(Array.isArray(body.monthlyHistory)).toBe(true)
    expect(Array.isArray(body.thisMonthAllProjects)).toBe(true)
    expect(body.infraTiers).toBeDefined()
  })
})
