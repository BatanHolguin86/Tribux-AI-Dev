/**
 * Integration tests for auth API routes:
 *   POST /api/auth/login
 *   POST /api/auth/register
 *   POST /api/auth/signout
 *   POST /api/auth/admin-signout
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()

const createMockSupabase = () => ({
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    }),
  },
  from: vi.fn(),
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock rate limiting to avoid interference between tests
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 4,
    resetAt: Date.now() + 900_000,
  }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  AUTH_RATE_LIMIT: { maxAttempts: 5, windowMs: 900_000 },
}))

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function jsonRequest(body: unknown, origin = 'http://localhost:3000'): Request {
  return new Request('http://x', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin },
    body: JSON.stringify(body),
  })
}

/* ------------------------------------------------------------------ */
/*  Tests: POST /api/auth/login                                        */
/* ------------------------------------------------------------------ */

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('devuelve 400 con datos invalidos (email vacio)', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const res = await POST(jsonRequest({ email: '', password: 'test1234' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Datos invalidos.')
    expect(body.details).toBeDefined()
  })

  it('devuelve 400 con datos invalidos (password vacia)', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const res = await POST(jsonRequest({ email: 'test@example.com', password: '' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Datos invalidos.')
  })

  it('devuelve 400 con email mal formado', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const res = await POST(jsonRequest({ email: 'not-an-email', password: 'test1234' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Datos invalidos.')
  })

  it('devuelve 401 con credenciales incorrectas', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    })

    const { POST } = await import('@/app/api/auth/login/route')
    const res = await POST(jsonRequest({ email: 'test@example.com', password: 'wrong1234' }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Email o contrasena incorrectos.')
  })

  it('devuelve 200 con credenciales correctas', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null })

    const { POST } = await import('@/app/api/auth/login/route')
    const res = await POST(jsonRequest({ email: 'test@example.com', password: 'correct1234' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.remaining).toBeDefined()
  })

  it('llama a signInWithPassword con email y password correctos', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null })

    const { POST } = await import('@/app/api/auth/login/route')
    await POST(jsonRequest({ email: 'user@test.com', password: 'mypassword1' }))

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'mypassword1',
    })
  })

  it('devuelve 429 cuando rate limit es excedido', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    vi.mocked(checkRateLimit).mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 900_000,
    })

    const { POST } = await import('@/app/api/auth/login/route')
    const res = await POST(jsonRequest({ email: 'test@example.com', password: 'test1234' }))

    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toContain('Demasiados intentos')
    expect(body.retryAfter).toBeDefined()
  })
})

/* ------------------------------------------------------------------ */
/*  Tests: POST /api/auth/register                                     */
/* ------------------------------------------------------------------ */

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('devuelve 400 con datos invalidos (sin nombre)', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const res = await POST(
      jsonRequest({ email: 'test@example.com', password: 'test1234', full_name: '' }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Datos invalidos.')
  })

  it('devuelve 400 con password corta (menos de 8 caracteres)', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const res = await POST(
      jsonRequest({ email: 'test@example.com', password: 'short1', full_name: 'Test User' }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Datos invalidos.')
    expect(body.details).toBeDefined()
  })

  it('devuelve 400 con password sin numero', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const res = await POST(
      jsonRequest({ email: 'test@example.com', password: 'nonumbers', full_name: 'Test User' }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Datos invalidos.')
  })

  it('devuelve 409 cuando el email ya esta registrado', async () => {
    mockSignUp.mockResolvedValueOnce({
      error: { message: 'User already registered' },
    })

    const { POST } = await import('@/app/api/auth/register/route')
    const res = await POST(
      jsonRequest({ email: 'existing@example.com', password: 'test1234', full_name: 'Test User' }),
    )

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toContain('ya esta registrado')
  })

  it('devuelve 500 cuando supabase retorna un error generico', async () => {
    mockSignUp.mockResolvedValueOnce({
      error: { message: 'Internal server error' },
    })

    const { POST } = await import('@/app/api/auth/register/route')
    const res = await POST(
      jsonRequest({ email: 'test@example.com', password: 'test1234', full_name: 'Test User' }),
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('Error al crear la cuenta')
  })

  it('devuelve 200 con registro exitoso', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null })

    const { POST } = await import('@/app/api/auth/register/route')
    const res = await POST(
      jsonRequest({ email: 'new@example.com', password: 'test1234', full_name: 'New User' }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('llama a signUp con full_name en metadata y emailRedirectTo', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null })

    const { POST } = await import('@/app/api/auth/register/route')
    await POST(
      jsonRequest(
        { email: 'new@example.com', password: 'test1234', full_name: 'New User' },
        'https://myapp.com',
      ),
    )

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'test1234',
      options: {
        data: { full_name: 'New User' },
        emailRedirectTo: 'https://myapp.com/auth/callback',
      },
    })
  })

  it('devuelve 429 cuando rate limit es excedido', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    vi.mocked(checkRateLimit).mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 900_000,
    })

    const { POST } = await import('@/app/api/auth/register/route')
    const res = await POST(
      jsonRequest({ email: 'test@example.com', password: 'test1234', full_name: 'Test' }),
    )

    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toContain('Demasiados intentos')
  })
})

/* ------------------------------------------------------------------ */
/*  Tests: POST /api/auth/signout                                      */
/* ------------------------------------------------------------------ */

describe('POST /api/auth/signout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('llama a signOut y redirige a /login', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })

    const { POST } = await import('@/app/api/auth/signout/route')
    const res = await POST()

    expect(mockSignOut).toHaveBeenCalled()
    expect(res.status).toBe(302)
    const location = res.headers.get('location')
    expect(location).toContain('/login')
  })

  it('redirige a /login incluso si signOut no falla', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })

    const { POST } = await import('@/app/api/auth/signout/route')
    const res = await POST()

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('/login')
    // Ensure it does NOT redirect to /admin/login
    expect(res.headers.get('location')).not.toContain('/admin/login')
  })
})

/* ------------------------------------------------------------------ */
/*  Tests: POST /api/auth/admin-signout                                */
/* ------------------------------------------------------------------ */

describe('POST /api/auth/admin-signout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('llama a signOut y redirige a /admin/login', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })

    const { POST } = await import('@/app/api/auth/admin-signout/route')
    const res = await POST()

    expect(mockSignOut).toHaveBeenCalled()
    expect(res.status).toBe(302)
    const location = res.headers.get('location')
    expect(location).toContain('/admin/login')
  })

  it('redirige a /admin/login (distinto a signout normal)', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })

    const { POST } = await import('@/app/api/auth/admin-signout/route')
    const res = await POST()

    const location = res.headers.get('location') || ''
    expect(location).toMatch(/\/admin\/login$/)
  })
})
