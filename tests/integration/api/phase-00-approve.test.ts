import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockUpdatePhaseSections = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
})

const mockUpdateProjectPhases = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
})

const mockUpdateProjects = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

const mockUpdateDoc = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

const createMockFrom = (overrides?: {
  projectDocumentsSelect?: { data: { id: string } | null }
  phaseSectionsSelect?: { data: { section: string; status: string }[] | null }
}) => {
  return vi.fn((table: string) => {
    if (table === 'project_documents') {
      const select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(
                overrides?.projectDocumentsSelect ?? { data: { id: 'doc-1' }, error: null }
              ),
            }),
          }),
        }),
      })
      return {
        select,
        update: mockUpdateDoc,
      }
    }
    if (table === 'phase_sections') {
      const select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(
            overrides?.phaseSectionsSelect ?? {
              data: [
                { section: 'problem_statement', status: 'approved' },
                { section: 'personas', status: 'approved' },
                { section: 'value_proposition', status: 'approved' },
                { section: 'metrics', status: 'approved' },
                { section: 'competitive_analysis', status: 'approved' },
              ],
              error: null,
            }
          ),
        }),
      })
      return {
        select,
        update: mockUpdatePhaseSections,
      }
    }
    if (table === 'project_phases') {
      return { update: mockUpdateProjectPhases }
    }
    if (table === 'projects') {
      return { update: mockUpdateProjects }
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
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Phase 00 approval flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  describe('POST /api/projects/[id]/phases/0/sections/[section]/approve', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/0/sections/[section]/approve/route'
      )

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', section: 'problem_statement' }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('No autenticado')
    })

    it('devuelve 400 si no existe documento para la seccion', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({ projectDocumentsSelect: { data: null } }) as never
      )

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/0/sections/[section]/approve/route'
      )

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', section: 'problem_statement' }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('documento')
    })

    it('aprueba seccion y retorna next_section', async () => {
      const { POST } = await import(
        '@/app/api/projects/[id]/phases/0/sections/[section]/approve/route'
      )

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', section: 'problem_statement' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({
        section: 'problem_statement',
        status: 'approved',
        next_section: 'personas',
      })
      expect(mockUpdatePhaseSections).toHaveBeenCalled()
      expect(mockUpdateDoc).toHaveBeenCalled()
    })

    it('retorna next_section null para la ultima seccion', async () => {
      const { POST } = await import(
        '@/app/api/projects/[id]/phases/0/sections/[section]/approve/route'
      )

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', section: 'competitive_analysis' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.next_section).toBeNull()
    })
  })

  describe('POST /api/projects/[id]/phases/0/approve', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/0/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(401)
    })

    it('devuelve 400 si faltan secciones por aprobar', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({
          phaseSectionsSelect: {
            data: [
              { section: 'problem_statement', status: 'approved' },
              { section: 'personas', status: 'in_progress' },
              { section: 'value_proposition', status: 'pending' },
              { section: 'metrics', status: 'pending' },
              { section: 'competitive_analysis', status: 'pending' },
            ],
          },
        }) as never
      )

      const { POST } = await import('@/app/api/projects/[id]/phases/0/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Faltan secciones')
      expect(body.pending).toContain('personas')
    })

    it('completa phase 0, desbloquea phase 1 y actualiza project_phases y projects', async () => {
      const { POST } = await import('@/app/api/projects/[id]/phases/0/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({
        phase: 0,
        status: 'completed',
        next_phase: 1,
        unlocked: true,
      })

      expect(mockUpdateProjectPhases).toHaveBeenCalledTimes(2)
      expect(mockUpdateProjects).toHaveBeenCalledWith(
        expect.objectContaining({ current_phase: 1 })
      )
    })
  })
})
