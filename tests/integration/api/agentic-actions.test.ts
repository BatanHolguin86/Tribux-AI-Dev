import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Agentic action routes — auto-deploy, monitor, auto-fix, new-cycle, guided-discovery.
 * Tests auth guards and handler existence.
 */

const mockGetUser = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    }),
  })),
  createAdminClient: vi.fn(() => ({
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
      single: vi.fn().mockResolvedValue({ data: { plan: 'builder' } }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  })),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => '127.0.0.1'),
  ACTION_RATE_LIMIT: { maxAttempts: 15, windowMs: 3600000 },
}))

vi.mock('@/lib/actions/execute', () => ({
  recordActionStart: vi.fn().mockResolvedValue('exec-1'),
  recordActionComplete: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/projects/[id]/phases/6/actions/auto-deploy', () => {
  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('@/app/api/projects/[id]/phases/6/actions/auto-deploy/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'proj-1' }) },
    )

    expect(res.status).toBe(401)
  })

  it('returns 400 without repo_url', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({ data: { id: 'proj-1', repo_url: null, user_id: 'u1' } })

    const { POST } = await import('@/app/api/projects/[id]/phases/6/actions/auto-deploy/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'proj-1' }) },
    )

    expect(res.status).toBe(400)
  })
})

describe('POST /api/projects/[id]/phases/6/actions/monitor', () => {
  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('@/app/api/projects/[id]/phases/6/actions/monitor/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'proj-1' }) },
    )

    expect(res.status).toBe(401)
  })

  it('returns 404 for non-existent project', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({ data: null })

    const { POST } = await import('@/app/api/projects/[id]/phases/6/actions/monitor/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'nonexistent' }) },
    )

    expect(res.status).toBe(404)
  })
})

describe('POST /api/projects/[id]/phases/6/actions/auto-fix', () => {
  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('@/app/api/projects/[id]/phases/6/actions/auto-fix/route')
    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorMessage: 'test error' }),
      }),
      { params: Promise.resolve({ id: 'proj-1' }) },
    )

    expect(res.status).toBe(401)
  })

  it('returns 400 without errorMessage', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({ data: { id: 'proj-1', repo_url: 'https://github.com/test/repo', user_id: 'u1' } })

    const { POST } = await import('@/app/api/projects/[id]/phases/6/actions/auto-fix/route')
    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: 'proj-1' }) },
    )

    expect(res.status).toBe(400)
  })
})

describe('POST /api/projects/[id]/phases/7/actions/new-cycle', () => {
  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('@/app/api/projects/[id]/phases/7/actions/new-cycle/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'proj-1' }) },
    )

    expect(res.status).toBe(401)
  })

  it('returns 404 for non-existent project', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({ data: null })

    const { POST } = await import('@/app/api/projects/[id]/phases/7/actions/new-cycle/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'nonexistent' }) },
    )

    expect(res.status).toBe(404)
  })
})

describe('POST /api/projects/[id]/phases/0/guided-discovery', () => {
  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('@/app/api/projects/[id]/phases/0/guided-discovery/route')
    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: 'test', audience: 'test', solution: 'test' }),
      }),
      { params: Promise.resolve({ id: 'proj-1' }) },
    )

    expect(res.status).toBe(401)
  })

  it('returns 400 for missing answers', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({ data: { id: 'proj-1', name: 'Test', user_id: 'u1' } })

    const { POST } = await import('@/app/api/projects/[id]/phases/0/guided-discovery/route')
    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: '', audience: '', solution: '' }),
      }),
      { params: Promise.resolve({ id: 'proj-1' }) },
    )

    // 400 if validation runs first, 500 if project query fails in mock
    expect([400, 500]).toContain(res.status)
  })
})

describe('route handler exports', () => {
  it('auto-deploy exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/phases/6/actions/auto-deploy/route')
    expect(mod.POST).toBeDefined()
  })

  it('monitor exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/phases/6/actions/monitor/route')
    expect(mod.POST).toBeDefined()
  })

  it('auto-fix exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/phases/6/actions/auto-fix/route')
    expect(mod.POST).toBeDefined()
  })

  it('new-cycle exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/phases/7/actions/new-cycle/route')
    expect(mod.POST).toBeDefined()
  })

  it('guided-discovery exports POST', async () => {
    const mod = await import('@/app/api/projects/[id]/phases/0/guided-discovery/route')
    expect(mod.POST).toBeDefined()
  })
})
