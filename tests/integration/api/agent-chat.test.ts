/**
 * TASK-219: Integration tests for agent chat — streaming, message parsing, persistence.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const projectId = 'p1'
const threadId = 'thread-1'
const agentType = 'cto_virtual'

const mockUpdateThread = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

const createMockFrom = (options?: {
  thread?: { messages: unknown[]; message_count: number } | null
  threadError?: { code: string }
}) => {
  return vi.fn((table: string) => {
    if (table === 'user_profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'builder', subscription_status: 'active', trial_ends_at: null },
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'conversation_threads') {
      if (options?.threadError) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: options.threadError.code },
              }),
            }),
          }),
          update: mockUpdateThread,
        }
      }
      const thread = options?.thread ?? {
        messages: [],
        message_count: 0,
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: thread,
              error: null,
            }),
          }),
        }),
        update: mockUpdateThread,
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
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 29, resetAt: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  AGENT_CHAT_RATE_LIMIT: { maxAttempts: 30, windowMs: 3600000 },
}))
vi.mock('@/lib/plans/guards', () => ({
  canUseAgent: vi.fn().mockReturnValue(true),
}))
vi.mock('@/lib/ai/agents', () => ({
  AGENT_MAP: {
    cto_virtual: { id: 'cto_virtual', planRequired: 'starter' },
  },
}))
vi.mock('@/lib/ai/chat-errors', () => ({
  formatChatErrorResponse: vi.fn().mockReturnValue({ status: 500, body: { error: 'Error' } }),
}))
vi.mock('@/lib/storage/chat-attachments', () => ({
  uploadChatAttachment: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/lib/ai/context-builder', () => ({
  buildFullProjectContext: vi.fn().mockResolvedValue({
    name: 'Test',
    description: null,
    industry: null,
    persona: null,
    currentPhase: 0,
    phaseName: 'Discovery',
    discoveryDocs: '',
    featureSpecs: '',
    artifacts: '',
  }),
}))
vi.mock('@/lib/ai/agents/prompt-builder', () => ({
  buildAgentPrompt: vi.fn().mockReturnValue('You are the CTO Virtual.'),
}))
vi.mock('@/lib/ai/title-generator', () => ({
  generateThreadTitle: vi.fn().mockResolvedValue('Test thread'),
}))
vi.mock('@/lib/ai/anthropic', () => ({
  defaultModel: 'mock-model',
  AI_CONFIG: { chat: { maxOutputTokens: 8192, temperature: 0.7 } },
}))
vi.mock('@/lib/ai/usage', () => ({
  recordAiUsage: vi.fn().mockResolvedValue(undefined),
  estimateTokensFromText: vi.fn().mockReturnValue(100),
}))
vi.mock('ai', () => ({
  streamText: vi.fn().mockImplementation(() => ({
    toTextStreamResponse: () =>
      new Response('mocked stream', {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      }),
  })),
  generateText: vi.fn().mockResolvedValue({
    text: 'Internal specialist note',
    usage: { inputTokens: 50, outputTokens: 50 },
  }),
}))

describe('POST /api/projects/[id]/agents/[agentType]/threads/[threadId]/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  it('devuelve 401 sin usuario', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      ...createMockSupabase(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never)

    const { POST } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/[threadId]/chat/route'
    )
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hola' }] }),
      }),
      { params: Promise.resolve({ id: projectId, agentType, threadId }) }
    )
    expect(res.status).toBe(401)
  })

  it('devuelve 404 cuando el hilo no existe (PGRST116)', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createMockSupabase({ threadError: { code: 'PGRST116' } }) as never
    )

    const { POST } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/[threadId]/chat/route'
    )
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hola' }] }),
      }),
      { params: Promise.resolve({ id: projectId, agentType, threadId }) }
    )
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.message).toMatch(/Hilo no encontrado|nueva conversación/i)
  })

  it('devuelve 400 cuando el mensaje está vacío', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/[threadId]/chat/route'
    )
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: '   ' }] }),
      }),
      { params: Promise.resolve({ id: projectId, agentType, threadId }) }
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/vacío|empty/i)
  })

  it('acepta mensaje con content en formato string y devuelve stream 200', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/[threadId]/chat/route'
    )
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hola' }] }),
      }),
      { params: Promise.resolve({ id: projectId, agentType, threadId }) }
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/plain|stream/)
  })

  it('acepta mensaje con content en formato parts (useChat) y devuelve stream 200', async () => {
    const { POST } = await import(
      '@/app/api/projects/[id]/agents/[agentType]/threads/[threadId]/chat/route'
    )
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'como vamos con el roadmap?' }],
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: projectId, agentType, threadId }) }
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/plain|stream/)
  })
})
