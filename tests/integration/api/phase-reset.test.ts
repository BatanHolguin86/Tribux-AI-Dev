/**
 * Integration tests for POST /api/projects/[id]/phases/[phase]/reset
 * Tests phase reset functionality: data deletion, status changes, cascading resets.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const projectId = 'proj-reset-1'

// Track delete/update calls per table
const deleteCalls: Record<string, unknown[]> = {}
const updateCalls: Record<string, unknown[]> = {}

const createMockChain = () => {
  const chain: Record<string, unknown> = {}
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.neq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
  chain.mockResolvedValue = vi.fn()
  // Make the chain thenable for await
  Object.assign(chain, { then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }) })
  return chain
}

const createMockAdminFrom = () =>
  vi.fn((table: string) => {
    const deleteChain = createMockChain()
    const updateChain = createMockChain()
    const upsertFn = vi.fn().mockResolvedValue({ error: null })

    return {
      delete: vi.fn().mockImplementation(() => {
        deleteCalls[table] = deleteCalls[table] || []
        deleteCalls[table].push(table)
        return deleteChain
      }),
      update: vi.fn().mockImplementation((data: unknown) => {
        updateCalls[table] = updateCalls[table] || []
        updateCalls[table].push(data)
        return updateChain
      }),
      upsert: upsertFn,
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }
  })

const createMockSupabase = (overrides?: { user?: null; project?: null }) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: overrides?.user === null ? null : { id: 'user-1' } },
      error: null,
    }),
  },
  from: vi.fn((table: string) => {
    if (table === 'projects') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: overrides?.project === null ? null : { id: projectId, user_id: 'user-1' },
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'project_features') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'feat-1' }, { id: 'feat-2' }],
            error: null,
          }),
        }),
      }
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }
  }),
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

describe('POST /api/projects/[id]/phases/[phase]/reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(deleteCalls).forEach((k) => delete deleteCalls[k])
    Object.keys(updateCalls).forEach((k) => delete updateCalls[k])
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
    vi.mocked(createAdminClient).mockResolvedValue({
      from: createMockAdminFrom(),
    } as never)
  })

  it('devuelve 401 sin usuario autenticado', async () => {
    vi.mocked(createClient).mockResolvedValueOnce(
      createMockSupabase({ user: null }) as never,
    )

    const { POST } = await import(
      '@/app/api/projects/[id]/phases/[phase]/reset/route'
    )
    const res = await POST(new Request('http://x', { method: 'POST' }), {
      params: Promise.resolve({ id: projectId, phase: '0' }),
    })
    expect(res.status).toBe(401)
  })

  it('devuelve 400 con phase invalida', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/phases/[phase]/reset/route'
    )
    const res = await POST(new Request('http://x', { method: 'POST' }), {
      params: Promise.resolve({ id: projectId, phase: '99' }),
    })
    expect(res.status).toBe(400)
  })

  it('devuelve 400 con phase no numerica', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/phases/[phase]/reset/route'
    )
    const res = await POST(new Request('http://x', { method: 'POST' }), {
      params: Promise.resolve({ id: projectId, phase: 'abc' }),
    })
    expect(res.status).toBe(400)
  })

  it('devuelve 404 cuando proyecto no existe', async () => {
    vi.mocked(createClient).mockResolvedValueOnce(
      createMockSupabase({ project: null }) as never,
    )

    const { POST } = await import(
      '@/app/api/projects/[id]/phases/[phase]/reset/route'
    )
    const res = await POST(new Request('http://x', { method: 'POST' }), {
      params: Promise.resolve({ id: 'no-existe', phase: '0' }),
    })
    expect(res.status).toBe(404)
  })

  it('devuelve 200 y respuesta exitosa al resetear Phase 01', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/phases/[phase]/reset/route'
    )
    const res = await POST(new Request('http://x', { method: 'POST' }), {
      params: Promise.resolve({ id: projectId, phase: '1' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.reset_phase).toBe(1)
    expect(body.phases_affected).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('devuelve 200 al resetear Phase 0', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/phases/[phase]/reset/route'
    )
    const res = await POST(new Request('http://x', { method: 'POST' }), {
      params: Promise.resolve({ id: projectId, phase: '0' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.phases_affected).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('devuelve 200 al resetear Phase 7 (solo afecta esa fase)', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/phases/[phase]/reset/route'
    )
    const res = await POST(new Request('http://x', { method: 'POST' }), {
      params: Promise.resolve({ id: projectId, phase: '7' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.phases_affected).toEqual([7])
  })
})
