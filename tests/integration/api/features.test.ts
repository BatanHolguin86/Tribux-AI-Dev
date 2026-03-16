import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockFeatures = [
  {
    id: 'feat-1',
    name: 'Login',
    description: 'Autenticacion',
    display_order: 0,
    status: 'pending',
    suggested_by: 'user',
    feature_documents: [],
  },
]

const createMockSupabase = (overrides?: {
  featuresSelect?: typeof mockFeatures
  featureInsert?: { data: { id: string; name: string; display_order: number } | null; error: { code?: string } | null }
  featureUpdate?: { data: Record<string, unknown> | null; error: Error | null }
  featureDeleteSelect?: { data: { status: string } | null }
}) => {
  const mockFrom = vi.fn((table: string) => {
    if (table === 'user_profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'builder', subscription_status: 'active', trial_ends_at: null },
              error: null,
            }),
          }),
        }),
      }
    }
    if (table !== 'project_features') return {}

    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: overrides?.featuresSelect ?? mockFeatures,
          error: null,
        }),
        single: vi.fn().mockResolvedValue(
          overrides?.featureDeleteSelect ?? { data: { status: 'pending' }, error: null }
        ),
      }),
    })

    const selectCount = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ count: mockFeatures.length, error: null }),
    })

    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(
          overrides?.featureInsert ?? {
            data: { id: 'feat-2', name: 'Nuevo Feature', display_order: 1 },
            error: null,
          }
        ),
      }),
    })

    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            overrides?.featureUpdate ?? {
              data: { id: 'feat-1', name: 'Login actualizado', display_order: 0 },
              error: null,
            }
          ),
        }),
      }),
    })

    const del = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    return {
      select: (cols: string, opts?: { count?: string; head?: boolean }) =>
        opts?.count === 'exact' && opts?.head ? selectCount() : select(cols),
      insert,
      update,
      delete: del,
      eq: select().eq,
      order: select().order,
    }
  })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: mockFrom,
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/plans/guards', () => ({
  canCreateFeatureInPhase01: vi.fn().mockReturnValue(true),
}))

describe('Features CRUD API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  describe('GET /api/projects/[id]/phases/1/features', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { GET } = await import('@/app/api/projects/[id]/phases/1/features/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(401)
    })

    it('lista features con documentos enriquecidos', async () => {
      const { GET } = await import('@/app/api/projects/[id]/phases/1/features/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('features')
      expect(body).toHaveProperty('features_completed')
      expect(body).toHaveProperty('features_total')
      expect(body).toHaveProperty('phase_status')
    })
  })

  describe('POST /api/projects/[id]/phases/1/features', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/1/features/route')

      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ name: 'Nuevo Feature' }),
        }),
        { params: Promise.resolve({ id: 'proj-1' }) }
      )

      expect(res.status).toBe(401)
    })

    it('devuelve 400 con datos invalidos', async () => {
      const { POST } = await import('@/app/api/projects/[id]/phases/1/features/route')

      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ name: '' }),
        }),
        { params: Promise.resolve({ id: 'proj-1' }) }
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('invalidos')
    })

    it('crea feature y retorna 201', async () => {
      const { POST } = await import('@/app/api/projects/[id]/phases/1/features/route')

      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ name: 'Nuevo Feature', description: 'Desc' }),
        }),
        { params: Promise.resolve({ id: 'proj-1' }) }
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('name', 'Nuevo Feature')
      expect(body).toHaveProperty('display_order')
    })
  })

  describe('PATCH /api/projects/[id]/phases/1/features/[featureId]', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { PATCH } = await import('@/app/api/projects/[id]/phases/1/features/[featureId]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Actualizado' }),
        }),
        { params: Promise.resolve({ id: 'proj-1', featureId: 'feat-1' }) }
      )

      expect(res.status).toBe(401)
    })

    it('edita feature (nombre y descripcion)', async () => {
      const { PATCH } = await import('@/app/api/projects/[id]/phases/1/features/[featureId]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Login v2', description: 'Desc actualizada' }),
        }),
        { params: Promise.resolve({ id: 'proj-1', featureId: 'feat-1' }) }
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('name', 'Login actualizado')
    })

    it('reordena feature via display_order', async () => {
      const { PATCH } = await import('@/app/api/projects/[id]/phases/1/features/[featureId]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ display_order: 2 }),
        }),
        { params: Promise.resolve({ id: 'proj-1', featureId: 'feat-1' }) }
      )

      expect(res.status).toBe(200)
    })
  })

  describe('DELETE /api/projects/[id]/phases/1/features/[featureId]', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { DELETE } = await import('@/app/api/projects/[id]/phases/1/features/[featureId]/route')

      const res = await DELETE(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', featureId: 'feat-1' }),
      })

      expect(res.status).toBe(401)
    })

    it('devuelve 400 si el feature no esta en status pending', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({
          featureDeleteSelect: { data: { status: 'in_progress' } },
        }) as never
      )

      const { DELETE } = await import('@/app/api/projects/[id]/phases/1/features/[featureId]/route')

      const res = await DELETE(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', featureId: 'feat-1' }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('documentos en progreso')
    })

    it('elimina feature cuando status es pending', async () => {
      const { DELETE } = await import('@/app/api/projects/[id]/phases/1/features/[featureId]/route')

      const res = await DELETE(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', featureId: 'feat-1' }),
      })

      expect(res.status).toBe(204)
    })
  })
})
