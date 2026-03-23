import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mock variables are available when vi.mock factory runs
const {
  mockGetUser,
  mockSelect,
  mockEq,
  mockSingle,
  mockFromFn,
} = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()
  const mockFromFn = vi.fn()
  return { mockGetUser, mockSelect, mockEq, mockSingle, mockFromFn }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFromFn,
  }),
}))

import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'

beforeEach(() => {
  vi.clearAllMocks()
  // Set up the chained mock: from().select().eq().single()
  mockFromFn.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ single: mockSingle })
})

describe('requireFinancialAdmin', () => {
  it('returns 401 when no user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const result = await requireFinancialAdmin()

    expect(result).toEqual({
      allowed: false,
      status: 401,
      body: { error: 'unauthorized', message: 'No autenticado' },
    })
  })

  it('returns 403 when user has a regular role', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    mockSingle.mockResolvedValue({
      data: { role: 'user' },
    })

    const result = await requireFinancialAdmin()

    expect(result).toEqual({
      allowed: false,
      status: 403,
      body: {
        error: 'forbidden',
        message: 'Acceso reservado al administrador financiero.',
      },
    })
  })

  it('returns 403 when user has no profile (role undefined)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-456' } },
    })
    mockSingle.mockResolvedValue({
      data: null,
    })

    const result = await requireFinancialAdmin()

    expect(result).toEqual({
      allowed: false,
      status: 403,
      body: {
        error: 'forbidden',
        message: 'Acceso reservado al administrador financiero.',
      },
    })
  })

  it('allows financial_admin role', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
    })
    mockSingle.mockResolvedValue({
      data: { role: 'financial_admin' },
    })

    const result = await requireFinancialAdmin()

    expect(result).toEqual({ allowed: true, userId: 'admin-1' })
  })

  it('allows super_admin role', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'super-1' } },
    })
    mockSingle.mockResolvedValue({
      data: { role: 'super_admin' },
    })

    const result = await requireFinancialAdmin()

    expect(result).toEqual({ allowed: true, userId: 'super-1' })
  })

  it('queries the user_profiles table with correct user ID', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-789' } },
    })
    mockSingle.mockResolvedValue({
      data: { role: 'financial_admin' },
    })

    await requireFinancialAdmin()

    expect(mockFromFn).toHaveBeenCalledWith('user_profiles')
    expect(mockSelect).toHaveBeenCalledWith('role')
    expect(mockEq).toHaveBeenCalledWith('id', 'user-789')
  })

  it('returns 403 for editor role', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'editor-1' } },
    })
    mockSingle.mockResolvedValue({
      data: { role: 'editor' },
    })

    const result = await requireFinancialAdmin()

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.status).toBe(403)
    }
  })
})
