import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

const createMockSupabase = (overrides?: {
  updateResult?: { error: Error | null }
}) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    }),
  },
  from: vi.fn((table: string) => {
    if (table === 'user_profiles') {
      const update = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(
          overrides?.updateResult ?? { error: null }
        ),
      })
      return { update }
    }
    return {}
  }),
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('User profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  describe('PATCH /api/user/profile', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { PATCH } = await import('@/app/api/user/profile/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ full_name: 'Juan' }),
        })
      )

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('No autenticado')
    })

    it('devuelve 400 con nombre vacio', async () => {
      const { PATCH } = await import('@/app/api/user/profile/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ full_name: '' }),
        })
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('invalido')
    })

    it('devuelve 400 con nombre demasiado largo', async () => {
      const { PATCH } = await import('@/app/api/user/profile/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ full_name: 'A'.repeat(101) }),
        })
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('invalido')
    })

    it('devuelve 400 con nombre solo espacios', async () => {
      const { PATCH } = await import('@/app/api/user/profile/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ full_name: '   ' }),
        })
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('invalido')
    })

    it('devuelve 400 sin campo full_name', async () => {
      const { PATCH } = await import('@/app/api/user/profile/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ other_field: 'value' }),
        })
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('invalido')
    })

    it('actualiza nombre correctamente y retorna ok', async () => {
      const { PATCH } = await import('@/app/api/user/profile/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ full_name: 'Juan Perez' }),
        })
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({ ok: true })
    })

    it('devuelve 500 si la actualizacion falla en la DB', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          updateResult: { error: new Error('DB error') },
        }) as never
      )

      const { PATCH } = await import('@/app/api/user/profile/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ full_name: 'Juan Perez' }),
        })
      )

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toContain('Error')
    })
  })
})
