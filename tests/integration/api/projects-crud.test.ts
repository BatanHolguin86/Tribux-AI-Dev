import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockProjects = [
  {
    id: 'proj-1',
    name: 'Proyecto Alpha',
    description: 'Desc Alpha',
    industry: 'tech',
    status: 'active',
    current_phase: 1,
    last_activity: '2026-03-20T00:00:00Z',
    created_at: '2026-03-01T00:00:00Z',
    user_id: 'user-123',
    project_phases: [
      { phase_number: 0, status: 'completed' },
      { phase_number: 1, status: 'active' },
    ],
  },
]

const createMockFrom = (overrides?: {
  projectsSelect?: { data: typeof mockProjects | null; error: Error | null }
  projectInsert?: { data: { id: string; name: string; current_phase: number } | null; error: Error | null }
  projectUpdate?: { data: Record<string, unknown> | null; error: Error | null }
  profileSelect?: { data: { plan: string } | null; error: Error | null }
  projectCount?: { count: number | null; error: Error | null }
  phasesCount?: { count: number | null; error: Error | null }
}) => {
  return vi.fn((table: string) => {
    if (table === 'projects') {
      const selectForList = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(
              overrides?.projectsSelect ?? { data: mockProjects, error: null }
            ),
          }),
        }),
      })

      const selectCount = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(
            overrides?.projectCount ?? { count: 1, error: null }
          ),
          neq: vi.fn().mockResolvedValue(
            overrides?.projectCount ?? { count: 1, error: null }
          ),
        }),
      })

      const insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            overrides?.projectInsert ?? {
              data: { id: 'proj-new', name: 'Nuevo Proyecto', current_phase: 0 },
              error: null,
            }
          ),
        }),
      })

      const update = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(
                overrides?.projectUpdate ?? {
                  data: { id: 'proj-1', name: 'Proyecto Actualizado', status: 'active' },
                  error: null,
                }
              ),
            }),
          }),
        }),
      })

      return {
        select: (cols: string, opts?: { count?: string; head?: boolean }) =>
          opts?.count === 'exact' && opts?.head ? selectCount(cols, opts) : selectForList(cols),
        insert,
        update,
      }
    }

    if (table === 'user_profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(
              overrides?.profileSelect ?? { data: { plan: 'builder' }, error: null }
            ),
          }),
        }),
      }
    }

    if (table === 'project_phases') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue(
                overrides?.phasesCount ?? { count: 2, error: null }
              ),
            }),
          }),
        }),
      }
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

describe('Projects CRUD API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  // ── GET /api/projects ──

  describe('GET /api/projects', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { GET } = await import('@/app/api/projects/route')

      const res = await GET(new Request('http://x/api/projects'))

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('No autenticado')
    })

    it('lista proyectos activos con summary', async () => {
      const { GET } = await import('@/app/api/projects/route')

      const res = await GET(new Request('http://x/api/projects'))

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('projects')
      expect(body).toHaveProperty('summary')
      expect(body.summary).toHaveProperty('total_active')
      expect(body.summary).toHaveProperty('phases_completed_this_week')
      expect(body.projects).toHaveLength(1)
      expect(body.projects[0]).toHaveProperty('id', 'proj-1')
      expect(body.projects[0]).toHaveProperty('name', 'Proyecto Alpha')
      expect(body.projects[0]).toHaveProperty('active_phase')
      expect(body.projects[0]).toHaveProperty('phases_completed')
      expect(body.projects[0]).toHaveProperty('progress_percentage')
      expect(body.projects[0]).toHaveProperty('next_action')
    })

    it('filtra por status via query param', async () => {
      const { GET } = await import('@/app/api/projects/route')

      const res = await GET(new Request('http://x/api/projects?status=archived'))

      expect(res.status).toBe(200)
    })

    it('devuelve 500 si la consulta falla', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          projectsSelect: { data: null, error: new Error('DB error') },
        }) as never
      )

      const { GET } = await import('@/app/api/projects/route')

      const res = await GET(new Request('http://x/api/projects'))

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toContain('Error')
    })
  })

  // ── POST /api/projects ──

  describe('POST /api/projects', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import('@/app/api/projects/route')

      const res = await POST(
        new Request('http://x/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        })
      )

      expect(res.status).toBe(401)
    })

    it('devuelve 400 con datos invalidos (nombre vacio)', async () => {
      const { POST } = await import('@/app/api/projects/route')

      const res = await POST(
        new Request('http://x/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name: '' }),
        })
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('invalidos')
      expect(body.code).toBe('VALIDATION_ERROR')
    })

    it('devuelve 400 con nombre demasiado largo', async () => {
      const { POST } = await import('@/app/api/projects/route')

      const res = await POST(
        new Request('http://x/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name: 'A'.repeat(101) }),
        })
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('VALIDATION_ERROR')
    })

    it('crea proyecto y retorna 201', async () => {
      const { POST } = await import('@/app/api/projects/route')

      const res = await POST(
        new Request('http://x/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name: 'Nuevo Proyecto', description: 'Desc', industry: 'fintech' }),
        })
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body).toHaveProperty('id', 'proj-new')
      expect(body).toHaveProperty('name', 'Nuevo Proyecto')
      expect(body).toHaveProperty('current_phase', 0)
    })

    it('devuelve 403 si se alcanzo el limite del plan', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          profileSelect: { data: { plan: 'starter' }, error: null },
          projectCount: { count: 1, error: null },
        }) as never
      )

      const { POST } = await import('@/app/api/projects/route')

      const res = await POST(
        new Request('http://x/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name: 'Otro Proyecto' }),
        })
      )

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('PLAN_LIMIT_REACHED')
    })

    it('devuelve 500 si el insert falla', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          profileSelect: { data: { plan: 'enterprise' }, error: null },
          projectCount: { count: 0, error: null },
          projectInsert: { data: null, error: new Error('Insert failed') },
        }) as never
      )

      const { POST } = await import('@/app/api/projects/route')

      const res = await POST(
        new Request('http://x/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name: 'Proyecto Fallido' }),
        })
      )

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toContain('Error')
    })
  })

  // ── PATCH /api/projects/[id] ──

  describe('PATCH /api/projects/[id]', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { PATCH } = await import('@/app/api/projects/[id]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Actualizado' }),
        }),
        { params: Promise.resolve({ id: 'proj-1' }) }
      )

      expect(res.status).toBe(401)
    })

    it('devuelve 400 con datos invalidos', async () => {
      const { PATCH } = await import('@/app/api/projects/[id]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'invalid_status' }),
        }),
        { params: Promise.resolve({ id: 'proj-1' }) }
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('invalidos')
    })

    it('actualiza proyecto correctamente', async () => {
      const { PATCH } = await import('@/app/api/projects/[id]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Proyecto Actualizado' }),
        }),
        { params: Promise.resolve({ id: 'proj-1' }) }
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('id', 'proj-1')
      expect(body).toHaveProperty('name', 'Proyecto Actualizado')
    })

    it('actualiza status del proyecto', async () => {
      const { PATCH } = await import('@/app/api/projects/[id]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'paused' }),
        }),
        { params: Promise.resolve({ id: 'proj-1' }) }
      )

      expect(res.status).toBe(200)
    })

    it('devuelve 500 si el update falla', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          projectUpdate: { data: null, error: new Error('Update failed') },
        }) as never
      )

      const { PATCH } = await import('@/app/api/projects/[id]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Fallo' }),
        }),
        { params: Promise.resolve({ id: 'proj-1' }) }
      )

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toContain('Error')
    })
  })
})
