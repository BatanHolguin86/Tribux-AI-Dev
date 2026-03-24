import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockSelectSingle = vi.fn().mockResolvedValue({
  data: { item_states: { '0': true } },
  error: null,
})

const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
})

const createMockSupabase = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    }),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSelectSingle,
          }),
        }),
      }),
    }),
    update: mockUpdate,
  })),
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('POST phase section item toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('rechaza fase no checklist', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/phases/[phase]/sections/[section]/item/route'
    )

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIndex: 0, completed: true }),
      }),
      { params: Promise.resolve({ id: 'p1', phase: '4', section: 'x' }) },
    )

    expect(res.status).toBe(400)
  })

  it('actualiza item_states en fase 3', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/phases/[phase]/sections/[section]/item/route'
    )

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIndex: 1, completed: true }),
      }),
      { params: Promise.resolve({ id: 'p1', phase: '3', section: 'repository' }) },
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.item_states['1']).toBe(true)
    expect(body.item_states['0']).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
  })
})
