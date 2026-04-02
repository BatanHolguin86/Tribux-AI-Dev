import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }) }) })

const createMockSupabase = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    }),
  },
  from: vi.fn((table: string) => {
    if (table === 'phase_sections') {
      return { update: mockUpdate }
    }
    if (table === 'agent_conversations') {
      return { upsert: mockUpsert }
    }
    return {}
  }),
})

const mockBuildProjectContext = vi.fn().mockResolvedValue({
  name: 'Test Project',
  description: 'Test description',
  industry: 'Fintech',
  persona: 'CEO',
  approvedSections: [],
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(createMockSupabase()),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 29, resetAt: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  AGENT_CHAT_RATE_LIMIT: { maxAttempts: 30, windowMs: 3600000 },
}))

vi.mock('@/lib/ai/chat-errors', () => ({
  formatChatErrorResponse: vi.fn().mockReturnValue({ status: 500, body: { error: 'Error' } }),
  wrapStreamWithErrorHandling: (stream: ReadableStream<Uint8Array>) => stream,
}))

vi.mock('@/lib/ai/anthropic', () => ({
  defaultModel: 'test-model',
  AI_CONFIG: { chat: { maxTokens: 100, temperature: 0.5 } },
}))

vi.mock('@/lib/ai/prompts/phase-00', () => ({
  buildPhase00Prompt: vi.fn().mockReturnValue('You are a discovery assistant.'),
}))

vi.mock('@/lib/ai/context-builder', () => ({
  buildProjectContext: mockBuildProjectContext,
}))

vi.mock('ai', () => ({
  streamText: vi.fn().mockImplementation(({ onFinish }: { onFinish?: (arg: { text: string }) => Promise<void> }) => {
    if (onFinish) {
      queueMicrotask(() => onFinish({ text: 'Respuesta mock del asistente' }))
    }
    return {
      toTextStreamResponse: () =>
        new Response('mocked stream', { headers: { 'content-type': 'text/plain' } }),
    }
  }),
}))

describe('POST /api/projects/[id]/phases/0/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockBuildProjectContext.mockResolvedValue({
      name: 'Test Project',
      description: 'Test description',
      industry: 'Fintech',
      persona: 'CEO',
      approvedSections: [],
    })
  })

  it('devuelve 401 cuando no hay usuario autenticado', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...createMockSupabase(),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    })

    const { POST } = await import('@/app/api/projects/[id]/phases/0/chat/route')
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ section: 'problem_statement', messages: [] }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'proj-123' }) })

    expect(res.status).toBe(401)
  })

  it('devuelve stream y persiste conversacion en agent_conversations', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const mockSupabase = createMockSupabase()
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)

    const { POST } = await import('@/app/api/projects/[id]/phases/0/chat/route')
    const messages = [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: 'Respuesta previa' },
    ]
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ section: 'problem_statement', messages }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'proj-456' }) })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text/)

    await new Promise((r) => setTimeout(r, 20))

    expect(mockBuildProjectContext).toHaveBeenCalledWith('proj-456')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'proj-456',
        phase_number: 0,
        section: 'problem_statement',
        agent_type: 'orchestrator',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Hola' }),
          expect.objectContaining({ role: 'assistant', content: 'Respuesta previa' }),
          expect.objectContaining({
            role: 'assistant',
            content: 'Respuesta mock del asistente',
          }),
        ]),
      }),
      expect.any(Object)
    )
  })
})
