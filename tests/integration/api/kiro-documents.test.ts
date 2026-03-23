/**
 * TASK-169: Integration tests for Phase 01 KIRO document flow:
 * chat → generate → approve per document type (requirements, design, tasks).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const projectId = 'p1'
const featureId = 'f1'
const docTypes = ['requirements', 'design', 'tasks'] as const

const mockUpsertConv = vi.fn().mockResolvedValue({ error: null })
const mockUpdateFeature = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
})
const mockUpdateFeatureDocs = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

/**
 * feature_documents is queried by multiple routes with different patterns:
 *
 * Chat route:
 *   1. select('content').eq('feature_id').eq('document_type').single() → existingDoc
 *
 * Generate route (regular supabase):
 *   2. select('document_type, content').eq('feature_id').eq('status','approved').neq('document_type') → ownDocs (array)
 *
 * Generate route (adminSupabase — separate mock):
 *   - upsert(...) → save doc
 *
 * Approve route:
 *   3. select('id, content').eq('feature_id').eq('document_type').single() → docForApprove
 *   4. update({status:'approved'...}).eq('id') → approve doc
 *   5. select('document_type, status').eq('feature_id') → allDocs (array)
 *
 * We use a counter to distinguish calls and return appropriate shapes.
 */
let featureDocsCallCount = 0

const createMockFrom = (options?: {
  conversation?: { messages: unknown[] } | null
  feature?: { name: string; description: string | null }
  docForApprove?: { id: string; content: string } | null
  allDocsAfterApprove?: { document_type: string; status: string }[]
}) => {
  featureDocsCallCount = 0
  return vi.fn((table: string) => {
    if (table === 'agent_conversations') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data:
                    options && 'conversation' in options
                      ? options.conversation
                      : {
                          messages: [
                            { role: 'user', content: 'Quiero requisitos para login' },
                            { role: 'assistant', content: 'Aquí los requisitos...' },
                          ],
                        },
                  error: null,
                }),
              }),
            }),
          }),
        }),
        upsert: mockUpsertConv,
      }
    }
    if (table === 'project_features') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: options?.feature ?? { name: 'Login', description: 'Auth feature' },
              error: null,
            }),
          }),
        }),
        update: mockUpdateFeature,
      }
    }
    if (table === 'feature_documents') {
      featureDocsCallCount++
      const call = featureDocsCallCount

      const docForApprove = options?.docForApprove ?? {
        id: 'fd-1',
        content: 'create table user_profiles (id uuid);',
      }
      const allDocs = options?.allDocsAfterApprove ?? [
        { document_type: 'requirements', status: 'approved' },
        { document_type: 'design', status: 'approved' },
        { document_type: 'tasks', status: 'draft' },
      ]

      // Build a flexible select mock that handles all query patterns:
      // - .eq().eq().single() → returns single doc (existingDoc from chat, docForApprove from approve)
      // - .eq().eq().neq() → returns array (ownDocs from generate)
      // - .eq() → returns array (allDocs from approve)
      const singleResult = call <= 2
        ? { data: null, error: null } // calls 1-2: chat existingDoc + generate ownDocs (no existing doc)
        : { data: docForApprove, error: null } // call 3+: approve docForApprove

      const selectChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(singleResult),
            neq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          single: vi.fn().mockResolvedValue(singleResult),
        }),
      }

      // For the "allDocs" select in approve (select then eq returning array)
      const allDocsChain = {
        eq: vi.fn().mockResolvedValue({ data: allDocs, error: null }),
      }

      return {
        select: vi.fn().mockImplementation(() => {
          // Approve route's second select (allDocs) is call 5 in the full flow
          if (call === 5) return allDocsChain
          return selectChain
        }),
        update: mockUpdateFeatureDocs,
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    return {}
  })
}

const createMockAdminFrom = () => {
  return vi.fn((table: string) => {
    if (table === 'feature_documents') {
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    return {}
  })
}

const createMockSupabase = (opts?: Parameters<typeof createMockFrom>[0]) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    }),
  },
  from: createMockFrom(opts),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
})

const createMockAdminSupabase = () => ({
  from: createMockAdminFrom(),
})

const mockStreamResponse = () =>
  new Response('mocked stream', { headers: { 'content-type': 'text/plain; charset=utf-8' } })

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))
vi.mock('@/lib/ai/context-builder', () => ({
  buildProjectContext: vi.fn().mockResolvedValue({
    name: 'Test',
    description: 'Desc',
    industry: 'Fintech',
    persona: 'CEO',
  }),
  buildFullProjectContext: vi.fn().mockResolvedValue({
    name: 'Test',
    description: 'Desc',
    industry: 'Fintech',
    persona: 'CEO',
  }),
  getApprovedDiscoveryDocs: vi.fn().mockResolvedValue(''),
  getApprovedFeatureSpecs: vi.fn().mockResolvedValue(''),
}))
vi.mock('@/lib/ai/agents/prompt-builder', () => ({
  buildAgentPrompt: vi.fn().mockReturnValue('You are a specialist agent.'),
}))
vi.mock('@/lib/storage/documents', () => ({
  uploadDocument: vi.fn().mockResolvedValue('projects/p1/specs/login/requirements.md'),
}))
vi.mock('@/lib/ai/usage', () => ({
  recordAiUsage: vi.fn().mockResolvedValue(undefined),
  estimateTokensFromText: vi.fn().mockReturnValue(100),
}))
vi.mock('ai', () => ({
  streamText: vi.fn().mockImplementation(({ onFinish }: { onFinish?: (arg: { text: string; usage?: { inputTokens: number; outputTokens: number } }) => Promise<void> }) => {
    if (onFinish) {
      queueMicrotask(() => onFinish({ text: 'Generated document content', usage: { inputTokens: 50, outputTokens: 50 } }))
    }
    return {
      toTextStreamResponse: () =>
        new Response('mocked stream', { headers: { 'content-type': 'text/plain; charset=utf-8' } }),
    }
  }),
  generateText: vi.fn().mockResolvedValue({
    text: 'Generated document content',
    usage: { inputTokens: 50, outputTokens: 50 },
  }),
}))

describe('Phase 01 KIRO documents flow (chat → generate → approve)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
    vi.mocked(createAdminClient).mockResolvedValue(createMockAdminSupabase() as never)
  })

  describe('POST /api/.../phases/1/features/[featureId]/chat', () => {
    it('devuelve 401 sin usuario', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/1/features/[featureId]/chat/route'
      )
      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_type: 'requirements', messages: [] }),
        }),
        { params: Promise.resolve({ id: projectId, featureId }) }
      )
      expect(res.status).toBe(401)
    })

    it('devuelve stream 200 con document_type y messages', async () => {
      const { POST } = await import(
        '@/app/api/projects/[id]/phases/1/features/[featureId]/chat/route'
      )
      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_type: 'requirements',
            messages: [{ role: 'user', content: 'Hola' }],
          }),
        }),
        { params: Promise.resolve({ id: projectId, featureId }) }
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toMatch(/text\/plain|stream/)
    })
  })

  describe('POST /api/.../phases/1/features/[featureId]/documents/[docType]/generate', () => {
    it('devuelve 401 sin usuario', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/generate/route'
      )
      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: projectId, featureId, docType: 'requirements' }),
      })
      expect(res.status).toBe(401)
    })

    it('devuelve 400 cuando no hay conversación', async () => {
      vi.mocked(createClient).mockResolvedValue(
        createMockSupabase({ conversation: null }) as never
      )
      vi.mocked(createAdminClient).mockResolvedValue(createMockAdminSupabase() as never)

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/generate/route'
      )
      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: projectId, featureId, docType: 'requirements' }),
      })
      expect(res.status).toBe(400)
    })

    it('devuelve 200 cuando hay conversación', async () => {
      const { POST } = await import(
        '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/generate/route'
      )
      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: projectId, featureId, docType: 'requirements' }),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('Flujo chat → generate → approve por tipo', () => {
    it.each(docTypes)(
      'completa flujo para %s: chat responde, generate devuelve stream, approve retorna 200',
      async (docType) => {
        const base = createMockSupabase()
        vi.mocked(createClient).mockResolvedValue(base as never)
        vi.mocked(createAdminClient).mockResolvedValue(createMockAdminSupabase() as never)

        const { POST: chatPost } = await import(
          '@/app/api/projects/[id]/phases/1/features/[featureId]/chat/route'
        )
        const chatRes = await chatPost(
          new Request('http://x', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              document_type: docType,
              messages: [{ role: 'user', content: 'Genera el doc' }],
            }),
          }),
          { params: Promise.resolve({ id: projectId, featureId }) }
        )
        expect(chatRes.status).toBe(200)

        const { POST: genPost } = await import(
          '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/generate/route'
        )
        const genRes = await genPost(new Request('http://x'), {
          params: Promise.resolve({ id: projectId, featureId, docType }),
        })
        expect(genRes.status).toBe(200)

        const { POST: approvePost } = await import(
          '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/approve/route'
        )
        const approveRes = await approvePost(new Request('http://x'), {
          params: Promise.resolve({ id: projectId, featureId, docType }),
        })
        expect(approveRes.status).toBe(200)
        const body = await approveRes.json()
        expect(body.document_type).toBe(docType)
        expect(body.status).toBe('approved')
      }
    )
  })
})
