import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockInsertDesignArtifacts = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: { id: 'art-1' },
      error: null,
    }),
  }),
})

const mockUpdateDesignArtifacts = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

const createMockFrom = (overrides?: {
  phaseStatus?: string
  featureCount?: number
}) => {
  return vi.fn((table: string) => {
    if (table === 'project_phases') {
      const select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { status: overrides?.phaseStatus ?? 'completed' },
              error: null,
            }),
          }),
        }),
      })
      return { select }
    }
    if (table === 'project_features') {
      // Used by Phase 01 active check: .select('id', { count: 'exact', head: true }).eq(...).in(...)
      const select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            count: overrides?.featureCount ?? 3,
            error: null,
          }),
        }),
      })
      return { select }
    }
    if (table === 'projects') {
      const select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'proj-1', name: 'Test Project', description: 'A test project' },
            error: null,
          }),
        }),
      })
      return { select }
    }
    if (table === 'design_artifacts') {
      return {
        insert: mockInsertDesignArtifacts,
        update: mockUpdateDesignArtifacts,
      }
    }
    if (table === 'storage') {
      return {}
    }
    return {}
  })
}

const createMockSupabase = (overrides?: Parameters<typeof createMockFrom>[0]) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    }),
  },
  from: createMockFrom(overrides),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: '<html><body>test design</body></html>',
    usage: { inputTokens: 100, outputTokens: 200 },
  }),
}))

vi.mock('@/lib/ai/anthropic', () => ({
  defaultModel: 'test-model',
  AI_CONFIG: {
    designPrompts: {
      maxOutputTokens: 8192,
      temperature: 0.5,
    },
  },
}))

vi.mock('@/lib/ai/context-builder', () => ({
  getApprovedDiscoveryDocs: vi.fn().mockResolvedValue(''),
  getApprovedFeatureSpecs: vi.fn().mockResolvedValue(''),
}))

vi.mock('@/lib/ai/usage', () => ({
  recordAiUsage: vi.fn().mockResolvedValue(undefined),
  estimateTokensFromText: vi.fn().mockReturnValue(100),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 9,
    resetAt: 0,
  }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  DESIGN_RATE_LIMIT: {
    maxAttempts: 10,
    windowMs: 3600000,
  },
}))

describe('POST /api/projects/[id]/designs/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('devuelve 401 sin usuario autenticado', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      ...createMockSupabase(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never)

    const { POST } = await import('@/app/api/projects/[id]/designs/generate/route')

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ type: 'wireframe', screens: ['home', 'dashboard'] }),
        headers: { 'Content-Type': 'application/json' },
      }),
      {
        params: Promise.resolve({ id: 'proj-1' }),
      }
    )

    expect(res.status).toBe(401)
  })

  it('devuelve 400 con body invalido (sin screens)', async () => {
    const { POST } = await import('@/app/api/projects/[id]/designs/generate/route')

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }),
      {
        params: Promise.resolve({ id: 'proj-1' }),
      }
    )

    expect(res.status).toBe(400)
  })

  it('devuelve 400 cuando Phase 01 esta locked', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createMockSupabase({ phaseStatus: 'locked' }) as never
    )

    const { POST } = await import('@/app/api/projects/[id]/designs/generate/route')

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ type: 'wireframe', screens: ['home', 'dashboard'] }),
        headers: { 'Content-Type': 'application/json' },
      }),
      {
        params: Promise.resolve({ id: 'proj-1' }),
      }
    )

    expect(res.status).toBe(400)
  })

  it('retorna response con status 200', async () => {
    const { POST } = await import('@/app/api/projects/[id]/designs/generate/route')

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ type: 'wireframe', screens: ['home', 'dashboard'] }),
        headers: { 'Content-Type': 'application/json' },
      }),
      {
        params: Promise.resolve({ id: 'proj-1' }),
      }
    )

    expect(res.status).toBe(200)
  })
})
