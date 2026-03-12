/**
 * TASK-169: Integration tests for Phase 01 KIRO document flow:
 * chat → generate → approve per document type (requirements, design, tasks).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

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

let convSelectCallCount = 0
let featureDocsCallCount = 0

const createMockFrom = (options?: {
  conversation?: { messages: unknown[] } | null
  feature?: { name: string; description: string | null }
  docForApprove?: { id: string; content: string } | null
  allDocsAfterApprove?: { document_type: string; status: string }[]
}) => {
  convSelectCallCount = 0
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
      const docSelect = options?.docForApprove ?? {
        id: 'fd-1',
        content: 'create table user_profiles (id uuid);',
      }
      const allDocs = options?.allDocsAfterApprove ?? [
        { document_type: 'requirements', status: 'approved' },
        { document_type: 'design', status: 'approved' },
        { document_type: 'tasks', status: 'draft' },
      ]
      // Call 1: generate upsert; 2: approve select single; 3: approve update; 4: approve select all
      const call = featureDocsCallCount
      const selectSingle = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: docSelect, error: null }),
          }),
        }),
      }
      const selectAll = {
        eq: vi.fn().mockResolvedValue({ data: allDocs, error: null }),
      }
      return {
        select: vi.fn().mockImplementation(() =>
          call === 2 ? selectSingle : call === 4 ? selectAll : {}
        ),
        update: mockUpdateFeatureDocs,
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

const mockStreamResponse = () =>
  new Response('mocked stream', { headers: { 'content-type': 'text/plain; charset=utf-8' } })

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/ai/context-builder', () => ({
  buildProjectContext: vi.fn().mockResolvedValue({
    name: 'Test',
    description: 'Desc',
    industry: 'Fintech',
    persona: 'CEO',
  }),
  getApprovedDiscoveryDocs: vi.fn().mockResolvedValue(''),
  getApprovedFeatureSpecs: vi.fn().mockResolvedValue(''),
}))
vi.mock('@/lib/storage/documents', () => ({
  uploadDocument: vi.fn().mockResolvedValue('projects/p1/specs/login/requirements.md'),
}))
vi.mock('ai', () => ({
  streamText: vi.fn().mockImplementation(({ onFinish }: { onFinish?: (arg: { text: string }) => Promise<void> }) => {
    if (onFinish) {
      queueMicrotask(() => onFinish({ text: 'Generated document content' }))
    }
    return {
      toTextStreamResponse: () =>
        new Response('mocked stream', { headers: { 'content-type': 'text/plain; charset=utf-8' } }),
    }
  }),
}))

describe('Phase 01 KIRO documents flow (chat → generate → approve)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
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

      const { POST } = await import(
        '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/generate/route'
      )
      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: projectId, featureId, docType: 'requirements' }),
      })
      expect(res.status).toBe(400)
    })

    it('devuelve 200 y stream cuando hay conversación', async () => {
      const { POST } = await import(
        '@/app/api/projects/[id]/phases/1/features/[featureId]/documents/[docType]/generate/route'
      )
      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: projectId, featureId, docType: 'requirements' }),
      })
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toMatch(/text\/plain|stream/)
    })
  })

  describe('Flujo chat → generate → approve por tipo', () => {
    it.each(docTypes)(
      'completa flujo para %s: chat responde, generate devuelve stream, approve retorna 200',
      async (docType) => {
        const base = createMockSupabase()
        vi.mocked(createClient).mockResolvedValue(base as never)

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
