import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * User API routes — quota, consumption, feedback messages.
 */

const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
  })),
  createAdminClient: vi.fn(() => ({
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      single: vi.fn().mockResolvedValue({ data: { plan: 'starter' } }),
    }),
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/user/quota', () => {
  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { GET } = await import('@/app/api/user/quota/route')
    const res = await GET()

    expect(res.status).toBe(401)
  })
})

describe('GET /api/user/consumption', () => {
  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { GET } = await import('@/app/api/user/consumption/route')
    const res = await GET()

    expect(res.status).toBe(401)
  })
})

describe('user feedback messages', () => {
  it('GET /api/user/feedback/[ticketId]/messages returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { GET } = await import('@/app/api/user/feedback/[ticketId]/messages/route')
    const res = await GET(
      new Request('http://localhost'),
      { params: Promise.resolve({ ticketId: 'test-id' }) },
    )

    expect(res.status).toBe(401)
  })

  it('POST /api/user/feedback/[ticketId]/messages returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('@/app/api/user/feedback/[ticketId]/messages/route')
    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'test' }),
      }),
      { params: Promise.resolve({ ticketId: 'test-id' }) },
    )

    expect(res.status).toBe(401)
  })
})
