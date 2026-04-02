/**
 * Integration tests: PATCH/DELETE /api/projects/[id]/integrations — Figma / v0 tokens.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const projectId = 'proj-int-1'
const userId = 'user-int-1'

const projectOk = {
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: projectId }, error: null }),
      }),
    }),
  }),
}

const updateOk = {
  update: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('PATCH /api/projects/[id]/integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without user', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
    } as never)

    const { PATCH } = await import('@/app/api/projects/[id]/integrations/route')
    const res = await PATCH(
      new Request('http://x', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figma_token: 'ftok' }),
      }),
      { params: Promise.resolve({ id: projectId }) },
    )
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is invalid', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === 'projects') return { ...projectOk, ...updateOk }
        return {}
      }),
    } as never)

    const { PATCH } = await import('@/app/api/projects/[id]/integrations/route')
    const res = await PATCH(
      new Request('http://x', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figma_token: 12345 }),
      }),
      { params: Promise.resolve({ id: projectId }) },
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('invalid_input')
  })

  it('returns 200 and updates figma token', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === 'projects') {
          return {
            select: projectOk.select,
            update,
          }
        }
        return {}
      }),
    } as never)

    const { PATCH } = await import('@/app/api/projects/[id]/integrations/route')
    const res = await PATCH(
      new Request('http://x', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figma_token: 'secret-figma' }),
      }),
      { params: Promise.resolve({ id: projectId }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ figma_token: 'secret-figma' }),
    )
  })
})

describe('DELETE /api/projects/[id]/integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid provider', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
      },
      from: vi.fn(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      })),
    } as never)

    const { DELETE } = await import('@/app/api/projects/[id]/integrations/route')
    const res = await DELETE(
      new Request('http://x', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'not-real' }),
      }),
      { params: Promise.resolve({ id: projectId }) },
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('invalid_provider')
  })

  it('returns 200 for figma provider', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
      },
      from: vi.fn(() => ({ update })),
    } as never)

    const { DELETE } = await import('@/app/api/projects/[id]/integrations/route')
    const res = await DELETE(
      new Request('http://x', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'figma' }),
      }),
      { params: Promise.resolve({ id: projectId }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(update).toHaveBeenCalledWith({ figma_token: null })
  })
})
