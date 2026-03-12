/**
 * TASK-218: Integration tests for CRUD of agent threads — list, create, delete.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const projectId = 'p1'
const agentType = 'cto_virtual'

const mockThreads = [
  {
    id: 'thread-1',
    title: 'Primer hilo',
    message_count: 2,
    last_message_at: '2026-03-11T20:00:00Z',
    messages: [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: 'Hola, en qué puedo ayudarte?' },
    ],
  },
]

const createMockFrom = (options?: {
  threads?: typeof mockThreads | null
  insertError?: boolean
  deleteError?: boolean
}) => {
  return vi.fn((table: string) => {
    if (table === 'conversation_threads') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: options?.threads ?? mockThreads,
                error: null,
              }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(
              options?.insertError
                ? { data: null, error: { message: 'DB error' } }
                : { data: { id: 'thread-new', agent_type: agentType }, error: null }
            ),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(
            options?.deleteError ? { error: { message: 'Delete failed' } } : { error: null }
          ),
        }),
      }
    }
    if (table === 'user_profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'starter' },
              error: null,
            }),
          }),
        }),
      }
    }
    return {}
  })
}

const createMockSupabase = (opts?: Parameters<typeof createMockFrom>[0]) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    }),
  },
  from: createMockFrom(opts),
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

describe('GET /api/projects/[id]/agents/[agentType]/threads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('devuelve 401 sin usuario', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      ...createMockSupabase(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never)

    const { GET } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/route'
    )
    const res = await GET(new Request('http://x'), {
      params: Promise.resolve({ id: projectId, agentType }),
    })
    expect(res.status).toBe(401)
  })

  it('devuelve 200 y lista de threads con preview', async () => {
    const { GET } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/route'
    )
    const res = await GET(new Request('http://x'), {
      params: Promise.resolve({ id: projectId, agentType }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.threads).toBeDefined()
    expect(Array.isArray(body.threads)).toBe(true)
    expect(body.threads[0].id).toBe('thread-1')
    expect(body.threads[0].title).toBe('Primer hilo')
    expect(body.threads[0].message_count).toBe(2)
    expect(body.threads[0].preview).toBeDefined()
  })
})

describe('POST /api/projects/[id]/agents/[agentType]/threads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('devuelve 401 sin usuario', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      ...createMockSupabase(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never)

    const { POST } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/route'
    )
    const res = await POST(new Request('http://x'), {
      params: Promise.resolve({ id: projectId, agentType }),
    })
    expect(res.status).toBe(401)
  })

  it('devuelve 404 para agente inexistente', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/route'
    )
    const res = await POST(new Request('http://x'), {
      params: Promise.resolve({ id: projectId, agentType: 'invalid_agent' }),
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/agente|encontrado/i)
  })

  it('devuelve 201 y thread creado', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/route'
    )
    const res = await POST(new Request('http://x'), {
      params: Promise.resolve({ id: projectId, agentType }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('thread-new')
    expect(body.agent_type).toBe(agentType)
  })

  it('devuelve 500 si insert falla', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createMockSupabase({ insertError: true }) as never
    )

    const { POST } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/route'
    )
    const res = await POST(new Request('http://x'), {
      params: Promise.resolve({ id: projectId, agentType }),
    })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})

describe('DELETE /api/projects/[id]/agents/[agentType]/threads/[threadId]', () => {
  const threadId = 'thread-1'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('devuelve 401 sin usuario', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      ...createMockSupabase(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never)

    const { DELETE } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/[threadId]/route'
    )
    const res = await DELETE(new Request('http://x'), {
      params: Promise.resolve({ id: projectId, agentType, threadId }),
    })
    expect(res.status).toBe(401)
  })

  it('devuelve 204 al eliminar', async () => {
    const { DELETE } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/[threadId]/route'
    )
    const res = await DELETE(new Request('http://x'), {
      params: Promise.resolve({ id: projectId, agentType, threadId }),
    })
    expect(res.status).toBe(204)
  })

  it('devuelve 500 si delete falla', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createMockSupabase({ deleteError: true }) as never
    )

    const { DELETE } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/[threadId]/route'
    )
    const res = await DELETE(new Request('http://x'), {
      params: Promise.resolve({ id: projectId, agentType, threadId }),
    })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})
