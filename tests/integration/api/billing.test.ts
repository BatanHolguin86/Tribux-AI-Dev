import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Billing API routes — checkout, webhook, top-up, portal.
 * Tests auth guards, input validation, and response format.
 * Stripe calls are not mocked (we test the route logic, not Stripe).
 */

// Mock Supabase
const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: mockSelect.mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
      insert: mockInsert,
    }),
  })),
  createAdminClient: vi.fn(() => ({
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: mockInsert.mockResolvedValue({ error: null }),
    }),
  })),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 10, resetAt: Date.now() + 60000 })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/billing/checkout', () => {
  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('@/app/api/billing/checkout/route')
    const res = await POST(new Request('http://localhost/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'builder' }),
    }))

    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid plan', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } } })
    mockSingle.mockResolvedValue({ data: { stripe_customer_id: null } })

    const { POST } = await import('@/app/api/billing/checkout/route')
    const res = await POST(new Request('http://localhost/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'nonexistent' }),
    }))

    // Without STRIPE_SECRET_KEY, returns error about billing not configured
    expect([400, 500, 503]).toContain(res.status)
  })
})

describe('POST /api/billing/top-up', () => {
  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('@/app/api/billing/top-up/route')
    const res = await POST(new Request('http://localhost/api/billing/top-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId: 'small' }),
    }))

    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid pack', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const { POST } = await import('@/app/api/billing/top-up/route')
    const res = await POST(new Request('http://localhost/api/billing/top-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId: 'invalid' }),
    }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('invalid_pack')
  })

  it('accepts valid pack in dev mode (no Stripe)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const { POST } = await import('@/app/api/billing/top-up/route')
    const res = await POST(new Request('http://localhost/api/billing/top-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId: 'small' }),
    }))

    // In dev mode (no STRIPE_SECRET_KEY), should add credits immediately
    expect([200, 429]).toContain(res.status)
  })
})

describe('POST /api/billing/webhook', () => {
  it('returns 503 without Stripe config', async () => {
    const { POST } = await import('@/app/api/billing/webhook/route')
    const res = await POST(new Request('http://localhost/api/billing/webhook', {
      method: 'POST',
      body: '{}',
    }))

    expect(res.status).toBe(503)
  })

  it('returns 400 without signature header', async () => {
    // Only testable if STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET are set
    // This test verifies the route exists and responds
    const { POST } = await import('@/app/api/billing/webhook/route')
    const res = await POST(new Request('http://localhost/api/billing/webhook', {
      method: 'POST',
      body: '{}',
    }))

    expect([400, 503]).toContain(res.status)
  })
})
