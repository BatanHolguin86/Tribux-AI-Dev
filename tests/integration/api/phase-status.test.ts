import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockSections = [
  { id: 'sec-1', section: 'problem_statement', status: 'approved', project_id: 'proj-1', phase_number: 0, created_at: '2026-01-01' },
]

const mockConversations = [
  { section: 'problem_statement', messages: [{ role: 'user', content: 'Hola' }] },
]

const mockDocuments = [
  { id: 'doc-1', name: 'brief.md', project_id: 'proj-1', phase_number: 0 },
]

const createMockFrom = (phaseNumber: number) => {
  return vi.fn((table: string) => {
    if (table === 'phase_sections') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockSections,
                error: null,
              }),
            }),
          }),
        }),
      }
    }
    if (table === 'agent_conversations') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockConversations,
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'project_documents') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockDocuments,
              error: null,
            }),
          }),
        }),
      }
    }
    return {}
  })
}

const createMockSupabase = (phaseNumber = 0) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    }),
  },
  from: createMockFrom(phaseNumber),
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Phase status API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  describe('GET /api/projects/[id]/phases/0/status', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { GET } = await import('@/app/api/projects/[id]/phases/0/status/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('No autenticado')
    })

    it('retorna sections, conversations y documents de fase 0', async () => {
      const { GET } = await import('@/app/api/projects/[id]/phases/0/status/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('sections')
      expect(body).toHaveProperty('conversations')
      expect(body).toHaveProperty('documents')
      expect(body.sections).toEqual(mockSections)
      expect(body.conversations).toEqual(mockConversations)
      expect(body.documents).toEqual(mockDocuments)
    })

    it('retorna arrays vacios cuando no hay datos', async () => {
      const emptyMock = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }
      vi.mocked(createClient).mockResolvedValueOnce(emptyMock as never)

      const { GET } = await import('@/app/api/projects/[id]/phases/0/status/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.sections).toEqual([])
      expect(body.conversations).toEqual([])
      expect(body.documents).toEqual([])
    })
  })

  describe('GET /api/projects/[id]/phases/2/status', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(2),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { GET } = await import('@/app/api/projects/[id]/phases/2/status/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('No autenticado')
    })

    it('retorna sections, conversations y documents de fase 2', async () => {
      vi.mocked(createClient).mockResolvedValue(createMockSupabase(2) as never)

      const { GET } = await import('@/app/api/projects/[id]/phases/2/status/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('sections')
      expect(body).toHaveProperty('conversations')
      expect(body).toHaveProperty('documents')
    })

    it('retorna arrays vacios cuando no hay datos para fase 2', async () => {
      const emptyMock = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }
      vi.mocked(createClient).mockResolvedValueOnce(emptyMock as never)

      const { GET } = await import('@/app/api/projects/[id]/phases/2/status/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.sections).toEqual([])
      expect(body.conversations).toEqual([])
      expect(body.documents).toEqual([])
    })
  })
})
