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

const createMockFrom = (overrides?: {
  sectionSelect?: { data: { section: string; status: string } | null }
}) => {
  return vi.fn((table: string) => {
    if (table === 'phase_sections') {
      const select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(
                overrides?.sectionSelect ?? {
                  data: { section: 'repository', status: 'pending' },
                  error: null,
                }
              ),
            }),
          }),
        }),
      })
      return {
        select,
        update: mockUpdatePhaseSections,
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

describe('Phase checklist toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  describe('Phase 03 toggle', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/3/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', section: 'repository' }),
      })

      expect(res.status).toBe(401)
    })

    it('marca seccion como completed', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({
          sectionSelect: { data: { section: 'repository', status: 'pending' } },
        }) as never
      )

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/3/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ status: 'completed' }), headers: { 'Content-Type': 'application/json' } }), {
        params: Promise.resolve({ id: 'proj-1', section: 'repository' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('completed')
      expect(mockUpdatePhaseSections).toHaveBeenCalled()
    })

    it('restaura seccion a pending', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({
          sectionSelect: { data: { section: 'repository', status: 'completed' } },
        }) as never
      )

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/3/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ status: 'pending' }), headers: { 'Content-Type': 'application/json' } }), {
        params: Promise.resolve({ id: 'proj-1', section: 'repository' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('pending')
      expect(mockUpdatePhaseSections).toHaveBeenCalled()
    })
  })

  describe('Phase 05 toggle', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/5/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', section: 'test_plan' }),
      })

      expect(res.status).toBe(401)
    })

    it('marca seccion como completed', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({
          sectionSelect: { data: { section: 'test_plan', status: 'pending' } },
        }) as never
      )

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/5/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ status: 'completed' }), headers: { 'Content-Type': 'application/json' } }), {
        params: Promise.resolve({ id: 'proj-1', section: 'test_plan' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('completed')
    })

    it('restaura seccion a pending', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({
          sectionSelect: { data: { section: 'test_plan', status: 'completed' } },
        }) as never
      )

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/5/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ status: 'pending' }), headers: { 'Content-Type': 'application/json' } }), {
        params: Promise.resolve({ id: 'proj-1', section: 'test_plan' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('pending')
    })
  })

  describe('Phase 06 toggle', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/6/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', section: 'deploy_production' }),
      })

      expect(res.status).toBe(401)
    })

    it('marca seccion como completed', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({
          sectionSelect: { data: { section: 'deploy_production', status: 'pending' } },
        }) as never
      )

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/6/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ status: 'completed' }), headers: { 'Content-Type': 'application/json' } }), {
        params: Promise.resolve({ id: 'proj-1', section: 'deploy_production' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('completed')
    })

    it('restaura seccion a pending', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({
          sectionSelect: { data: { section: 'deploy_production', status: 'completed' } },
        }) as never
      )

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/6/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ status: 'pending' }), headers: { 'Content-Type': 'application/json' } }), {
        params: Promise.resolve({ id: 'proj-1', section: 'deploy_production' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('pending')
    })
  })

  describe('Phase 07 toggle', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/7/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', section: 'feedback' }),
      })

      expect(res.status).toBe(401)
    })

    it('marca seccion como completed', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({
          sectionSelect: { data: { section: 'feedback', status: 'pending' } },
        }) as never
      )

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/7/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ status: 'completed' }), headers: { 'Content-Type': 'application/json' } }), {
        params: Promise.resolve({ id: 'proj-1', section: 'feedback' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('completed')
    })

    it('restaura seccion a pending', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({
          sectionSelect: { data: { section: 'feedback', status: 'completed' } },
        }) as never
      )

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/7/sections/[section]/toggle/route'
      )

      const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ status: 'pending' }), headers: { 'Content-Type': 'application/json' } }), {
        params: Promise.resolve({ id: 'proj-1', section: 'feedback' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('pending')
    })
  })
})
