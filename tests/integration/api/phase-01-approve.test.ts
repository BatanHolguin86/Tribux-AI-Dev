import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockUpdateFeatureDocs = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})
const mockUpdateFeature = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

let featureDocsCallCount = 0
const createMockFrom = (overrides?: { docSelect?: { data: { id: string; content: string } | null }; allDocsSelect?: { data: { document_type: string; status: string }[] } }) => {
  featureDocsCallCount = 0
  return vi.fn((table: string) => {
    if (table === 'feature_documents') {
      featureDocsCallCount++
      const isFirst = featureDocsCallCount === 1
      // 1st call: .select().eq().eq().single(); 2nd call: .select().eq() (no .single())
      const select = vi.fn().mockReturnValue(
        isFirst
          ? {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(
                    overrides?.docSelect ?? {
                      data: { id: 'fd-1', content: 'create table user_profiles (id uuid);' },
                      error: null,
                    }
                  ),
                }),
              }),
            }
          : {
              eq: vi.fn().mockResolvedValue(
                overrides?.allDocsSelect ?? {
                  data: [
                    { document_type: 'requirements', status: 'approved' },
                    { document_type: 'design', status: 'approved' },
                    { document_type: 'tasks', status: 'draft' },
                  ],
                  error: null,
                }
              ),
            }
      )
      return { select, update: mockUpdateFeatureDocs }
    }
    if (table === 'project_features') {
      return { update: mockUpdateFeature }
    }
    return {}
  })
}

const createMockSupabase = (overrides?: Parameters<typeof createMockFrom>[0]) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
  },
  from: createMockFrom(overrides),
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/ai/context-builder', () => ({
  getApprovedFeatureSpecs: vi.fn().mockResolvedValue(''),
}))

describe('POST /api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/approve', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
    const { getApprovedFeatureSpecs } = await import('@/lib/ai/context-builder')
    vi.mocked(getApprovedFeatureSpecs).mockResolvedValue('')
  })

  it('devuelve 401 sin usuario', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      ...createMockSupabase(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never)

    const { POST } = await import(
      '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/approve/route'
    )
    const res = await POST(new Request('http://x'), {
      params: Promise.resolve({ id: 'p1', featureId: 'f1', docType: 'design' }),
    })
    expect(res.status).toBe(401)
  })

  it('devuelve 400 si no hay documento', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createMockSupabase({ docSelect: { data: null } }) as never
    )

    const { POST } = await import(
      '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/approve/route'
    )
    const res = await POST(new Request('http://x'), {
      params: Promise.resolve({ id: 'p1', featureId: 'f1', docType: 'design' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('documento')
  })

  it('devuelve 400 con inconsistencies cuando el design viola coherencia', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createMockSupabase({
        docSelect: {
          data: {
            id: 'fd-1',
            content: 'create table UserProfiles (id uuid);',
          },
        },
      }) as never
    )

    const { POST } = await import(
      '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/approve/route'
    )
    const res = await POST(new Request('http://x'), {
      params: Promise.resolve({ id: 'p1', featureId: 'f1', docType: 'design' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('coherencia')
    expect(body.inconsistencies).toBeDefined()
    expect(Array.isArray(body.inconsistencies)).toBe(true)
  })

  it('aprueba y retorna 200 cuando design es coherente', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/approve/route'
    )
    const res = await POST(new Request('http://x'), {
      params: Promise.resolve({ id: 'p1', featureId: 'f1', docType: 'design' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('approved')
    expect(body.document_type).toBe('design')
  })

  it('aprueba tasks sin validacion de coherencia', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/approve/route'
    )
    const res = await POST(new Request('http://x'), {
      params: Promise.resolve({ id: 'p1', featureId: 'f1', docType: 'tasks' }),
    })
    expect(res.status).toBe(200)
  })
})
