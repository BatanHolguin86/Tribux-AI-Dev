/**
 * Integration tests for onboarding API routes:
 *   PATCH /api/onboarding/step
 *   POST  /api/onboarding/complete
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockUpdate = vi.fn()
const mockInsert = vi.fn()

const createMockFrom = (overrides?: {
  updateError?: { message: string } | null
  insertError?: { message: string } | null
  insertData?: { id: string } | null
}) => {
  return vi.fn((table: string) => {
    if (table === 'user_profiles') {
      return {
        update: mockUpdate.mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: overrides?.updateError ?? null,
          }),
        }),
      }
    }
    if (table === 'projects') {
      return {
        insert: mockInsert.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: overrides?.insertData ?? { id: 'proj-new-1' },
              error: overrides?.insertError ?? null,
            }),
          }),
        }),
      }
    }
    return {}
  })
}

const createMockSupabase = (overrides?: {
  user?: null
  updateError?: { message: string } | null
  insertError?: { message: string } | null
  insertData?: { id: string } | null
}) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: overrides?.user === undefined ? { id: 'user-123' } : overrides.user },
      error: null,
    }),
  },
  from: createMockFrom({
    updateError: overrides?.updateError,
    insertError: overrides?.insertError,
    insertData: overrides?.insertData,
  }),
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function jsonRequest(
  body: unknown,
  method: 'POST' | 'PATCH' | 'PUT' = 'POST',
): Request {
  return new Request('http://x', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/* ------------------------------------------------------------------ */
/*  Tests: PATCH /api/onboarding/step                                  */
/* ------------------------------------------------------------------ */

describe('PATCH /api/onboarding/step', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('devuelve 401 sin usuario autenticado', async () => {
    vi.mocked(createClient).mockResolvedValueOnce(
      createMockSupabase({ user: null }) as never,
    )

    const { PATCH } = await import('@/app/api/onboarding/step/route')
    const res = await PATCH(jsonRequest({ step: 1 }, 'PATCH'))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('No autenticado')
  })

  it('devuelve 400 con step invalido (negativo)', async () => {
    const { PATCH } = await import('@/app/api/onboarding/step/route')
    const res = await PATCH(jsonRequest({ step: -1 }, 'PATCH'))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Step invalido')
  })

  it('devuelve 400 con step invalido (mayor al maximo permitido)', async () => {
    const { PATCH } = await import('@/app/api/onboarding/step/route')
    const res = await PATCH(jsonRequest({ step: 6 }, 'PATCH'))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Step invalido')
  })

  it('devuelve 400 con step invalido (decimal)', async () => {
    const { PATCH } = await import('@/app/api/onboarding/step/route')
    const res = await PATCH(jsonRequest({ step: 1.5 }, 'PATCH'))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Step invalido')
  })

  it('devuelve 400 con step invalido (string)', async () => {
    const { PATCH } = await import('@/app/api/onboarding/step/route')
    const res = await PATCH(jsonRequest({ step: 'abc' }, 'PATCH'))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Step invalido')
  })

  it('devuelve 400 sin campo step en el body', async () => {
    const { PATCH } = await import('@/app/api/onboarding/step/route')
    const res = await PATCH(jsonRequest({}, 'PATCH'))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Step invalido')
  })

  it('devuelve 500 cuando falla la actualizacion en la base de datos', async () => {
    vi.mocked(createClient).mockResolvedValueOnce(
      createMockSupabase({ updateError: { message: 'DB error' } }) as never,
    )

    const { PATCH } = await import('@/app/api/onboarding/step/route')
    const res = await PATCH(jsonRequest({ step: 2 }, 'PATCH'))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('Error al actualizar step')
  })

  it('devuelve 200 con step 0 (valor minimo valido)', async () => {
    const { PATCH } = await import('@/app/api/onboarding/step/route')
    const res = await PATCH(jsonRequest({ step: 0 }, 'PATCH'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.step).toBe(0)
  })

  it('devuelve 200 con step 5 (valor maximo valido)', async () => {
    const { PATCH } = await import('@/app/api/onboarding/step/route')
    const res = await PATCH(jsonRequest({ step: 5 }, 'PATCH'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.step).toBe(5)
  })

  it('devuelve 200 y actualiza step correctamente', async () => {
    const { PATCH } = await import('@/app/api/onboarding/step/route')
    const res = await PATCH(jsonRequest({ step: 2 }, 'PATCH'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.step).toBe(2)
    expect(mockUpdate).toHaveBeenCalledWith({ onboarding_step: 2 })
  })
})

/* ------------------------------------------------------------------ */
/*  Tests: POST /api/onboarding/complete                               */
/* ------------------------------------------------------------------ */

describe('POST /api/onboarding/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('devuelve 401 sin usuario autenticado', async () => {
    vi.mocked(createClient).mockResolvedValueOnce(
      createMockSupabase({ user: null }) as never,
    )

    const { POST } = await import('@/app/api/onboarding/complete/route')
    const res = await POST(
      jsonRequest({
        persona: 'founder',
        project: { name: 'Test Project' },
      }),
    )

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('No autenticado')
  })

  it('devuelve 400 con datos invalidos (sin persona)', async () => {
    const { POST } = await import('@/app/api/onboarding/complete/route')
    const res = await POST(
      jsonRequest({
        project: { name: 'Test Project' },
      }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Datos invalidos')
  })

  it('devuelve 400 con datos invalidos (sin project.name)', async () => {
    const { POST } = await import('@/app/api/onboarding/complete/route')
    const res = await POST(
      jsonRequest({
        persona: 'founder',
        project: { name: '' },
      }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Datos invalidos')
  })

  it('devuelve 400 con persona invalida', async () => {
    const { POST } = await import('@/app/api/onboarding/complete/route')
    const res = await POST(
      jsonRequest({
        persona: 'astronaut',
        project: { name: 'My Project' },
      }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Datos invalidos')
  })

  it('devuelve 400 sin cuerpo de proyecto', async () => {
    const { POST } = await import('@/app/api/onboarding/complete/route')
    const res = await POST(
      jsonRequest({
        persona: 'pm',
      }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Datos invalidos')
  })

  it('devuelve 500 cuando falla la actualizacion del perfil', async () => {
    vi.mocked(createClient).mockResolvedValueOnce(
      createMockSupabase({ updateError: { message: 'Profile update failed' } }) as never,
    )

    const { POST } = await import('@/app/api/onboarding/complete/route')
    const res = await POST(
      jsonRequest({
        persona: 'founder',
        project: { name: 'Test Project' },
      }),
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('Error al actualizar perfil')
  })

  it('devuelve 500 cuando falla la creacion del proyecto', async () => {
    vi.mocked(createClient).mockResolvedValueOnce(
      createMockSupabase({ insertError: { message: 'Insert failed' } }) as never,
    )

    const { POST } = await import('@/app/api/onboarding/complete/route')
    const res = await POST(
      jsonRequest({
        persona: 'consultor',
        project: { name: 'Test Project' },
      }),
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('Error al crear proyecto')
  })

  it('devuelve 200 con datos validos y retorna project_id y redirect_to', async () => {
    const { POST } = await import('@/app/api/onboarding/complete/route')
    const res = await POST(
      jsonRequest({
        persona: 'founder',
        project: { name: 'My Startup', description: 'A cool idea', industry: 'Tech' },
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.project_id).toBe('proj-new-1')
    expect(body.redirect_to).toBe('/projects/proj-new-1/phase/00')
  })

  it('actualiza perfil con persona y onboarding completo', async () => {
    const { POST } = await import('@/app/api/onboarding/complete/route')
    await POST(
      jsonRequest({
        persona: 'emprendedor',
        project: { name: 'My Project' },
      }),
    )

    expect(mockUpdate).toHaveBeenCalledWith({
      persona: 'emprendedor',
      onboarding_completed: true,
      onboarding_step: 5,
    })
  })

  it('crea proyecto con user_id, nombre, y campos opcionales null cuando no se envian', async () => {
    const { POST } = await import('@/app/api/onboarding/complete/route')
    await POST(
      jsonRequest({
        persona: 'pm',
        project: { name: 'Minimal Project' },
      }),
    )

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      name: 'Minimal Project',
      description: null,
      industry: null,
      repo_url: null,
      supabase_project_ref: null,
      supabase_access_token: null,
      current_phase: 0,
      status: 'active',
    })
  })

  it('acepta todos los tipos de persona validos', async () => {
    const personas = ['founder', 'pm', 'consultor', 'emprendedor'] as const

    for (const persona of personas) {
      vi.clearAllMocks()
      vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)

      const { POST } = await import('@/app/api/onboarding/complete/route')
      const res = await POST(
        jsonRequest({
          persona,
          project: { name: `Project for ${persona}` },
        }),
      )

      expect(res.status).toBe(200)
    }
  })

  it('pasa description e industry al crear proyecto cuando se proveen', async () => {
    const { POST } = await import('@/app/api/onboarding/complete/route')
    await POST(
      jsonRequest({
        persona: 'founder',
        project: {
          name: 'Full Project',
          description: 'Detailed description',
          industry: 'Fintech',
        },
      }),
    )

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      name: 'Full Project',
      description: 'Detailed description',
      industry: 'Fintech',
      repo_url: null,
      supabase_project_ref: null,
      supabase_access_token: null,
      current_phase: 0,
      status: 'active',
    })
  })
})
