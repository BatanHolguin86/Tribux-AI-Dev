/**
 * TASK-221b: Integration tests for proactive suggestions — GET /api/projects/[id]/agents/suggestions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const projectId = 'p1'

const createMockSupabase = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    }),
  },
  from: vi.fn(() => ({})),
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/ai/context-builder', () => ({
  buildFullProjectContext: vi.fn().mockResolvedValue({
    name: 'Test',
    description: null,
    industry: null,
    persona: null,
    currentPhase: 1,
    phaseName: 'Requirements & Spec',
    discoveryDocs: '',
    featureSpecs: '',
    artifacts: '',
  }),
}))
vi.mock('@/lib/ai/agents/prompt-builder', () => ({
  buildSuggestionsPrompt: vi.fn().mockReturnValue('Suggest 2 features.'),
}))
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      suggestions: [
        { text: 'Revisa el roadmap con el CTO Virtual', type: 'cto_virtual' },
        { text: 'Define el primer feature en Phase 01', type: 'phase_01' },
      ],
    }),
  }),
}))

describe('GET /api/projects/[id]/agents/suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('devuelve 401 sin usuario', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      ...createMockSupabase(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never)

    const { GET } = await import(
      '@/app/api/projects/[id]/agents/suggestions/route'
    )
    const res = await GET(new Request('http://x'), {
      params: Promise.resolve({ id: projectId }),
    })
    expect(res.status).toBe(401)
  })

  it('devuelve 200 con suggestions cuando el LLM devuelve JSON válido', async () => {
    const { GET } = await import(
      '@/app/api/projects/[id]/agents/suggestions/route'
    )
    const res = await GET(new Request('http://x'), {
      params: Promise.resolve({ id: projectId }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.suggestions).toBeDefined()
    expect(Array.isArray(body.suggestions)).toBe(true)
    expect(body.suggestions.length).toBeGreaterThanOrEqual(1)
    expect(body.context_summary).toBeDefined()
    expect(body.context_summary.current_phase).toBe(1)
  })

  it('devuelve 200 con suggestions vacío cuando el LLM falla o parse falla', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockRejectedValueOnce(new Error('API error'))

    const { GET } = await import(
      '@/app/api/projects/[id]/agents/suggestions/route'
    )
    const res = await GET(new Request('http://x'), {
      params: Promise.resolve({ id: projectId }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.suggestions).toEqual([])
    expect(body.context_summary).toBeDefined()
  })
})
