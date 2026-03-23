import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

/* ------------------------------------------------------------------ */
/* Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockArtifacts = [
  {
    id: 'art-1',
    type: 'wireframe',
    screen_name: 'Home',
    flow_name: 'Main',
    status: 'draft',
    mime_type: 'text/html',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'art-2',
    type: 'mockup_lowfi',
    screen_name: 'Dashboard',
    flow_name: 'Main',
    status: 'approved',
    mime_type: 'text/html',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
]

const mockArtifactDetail = {
  id: 'art-1',
  type: 'wireframe',
  screen_name: 'Home',
  flow_name: 'Main',
  status: 'draft',
  mime_type: 'text/html',
  storage_path: 'projects/proj-1/designs/art-1.html',
  content: '<html><body>test</body></html>',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

/* ------------------------------------------------------------------ */
/* createMockSupabase — builds a fully-chainable fake client           */
/* ------------------------------------------------------------------ */

const createMockSupabase = (overrides?: {
  listResult?: { data: typeof mockArtifacts | null; error: Error | null }
  detailResult?: { data: typeof mockArtifactDetail | null; error: Error | null }
  patchResult?: { data: { id: string; status: string } | null; error: Error | null }
  refineArtifactResult?: { data: typeof mockArtifactDetail | null; error: Error | null }
  projectResult?: { data: { id: string; name: string } | null; error: Error | null }
  storagePath?: string | null
  mimeType?: string
  downloadContent?: string | null
}) => {
  const mockFrom = vi.fn((table: string) => {
    if (table === 'design_artifacts') {
      // Chain: select(...).eq('project_id', ...).order(...)  → list
      // Chain: select('*').eq('id', ...).eq('project_id', ...).single()  → detail
      // Chain: update({}).eq('id', ...).eq('project_id', ...).select(...).single()  → patch
      // Chain: update({}).eq('id', ...)  → status-only update (refine sets 'generating')

      const select = vi.fn().mockImplementation(() => {
        return {
          eq: vi.fn().mockImplementation(() => {
            return {
              // list path: .order(...)
              order: vi.fn().mockResolvedValue(
                overrides?.listResult ?? { data: mockArtifacts, error: null },
              ),
              // detail path: .eq('project_id', ...).single()
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(
                  overrides?.detailResult ?? { data: mockArtifactDetail, error: null },
                ),
              }),
              // patch sub-chain after update (see below)
              single: vi.fn().mockResolvedValue(
                overrides?.detailResult ?? { data: mockArtifactDetail, error: null },
              ),
            }
          }),
        }
      })

      const update = vi.fn().mockImplementation(() => {
        return {
          // .eq('id', artifactId).eq('project_id', ...).select().single() — PATCH path
          eq: vi.fn().mockImplementation(() => {
            return {
              // simple .eq(...) terminal for status update (refine: generating)
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(
                    overrides?.patchResult ?? { data: { id: 'art-1', status: 'approved' }, error: null },
                  ),
                }),
              }),
              // patch path: .select().single()
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(
                  overrides?.patchResult ?? { data: { id: 'art-1', status: 'approved' }, error: null },
                ),
              }),
            }
          }),
        }
      })

      return { select, update }
    }

    if (table === 'projects') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(
              overrides?.projectResult ?? {
                data: { id: 'proj-1', name: 'Test Project' },
                error: null,
              },
            ),
          }),
        }),
      }
    }

    // Catch-all for unknown tables
    return {}
  })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: mockFrom,
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://storage.example.com/signed-url' },
        }),
        download: vi.fn().mockResolvedValue({
          data: overrides?.downloadContent !== undefined
            ? (overrides.downloadContent !== null
                ? new Blob([overrides.downloadContent], { type: 'text/html' })
                : null)
            : new Blob(['<html><body>existing content</body></html>'], { type: 'text/html' }),
        }),
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  }
}

/* ------------------------------------------------------------------ */
/* Module mocks                                                        */
/* ------------------------------------------------------------------ */

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: '<html><body>refined design</body></html>',
    usage: { inputTokens: 100, outputTokens: 200 },
  }),
}))

vi.mock('@/lib/ai/anthropic', () => ({
  defaultModel: 'test-model',
  AI_CONFIG: {
    designPrompts: {
      maxOutputTokens: 8192,
      temperature: 0.5,
    },
  },
}))

vi.mock('@/lib/ai/prompts/design-generation', () => ({
  buildDesignRefinePrompt: vi.fn().mockReturnValue('system prompt for refine'),
}))

vi.mock('@/lib/ai/usage', () => ({
  recordAiUsage: vi.fn().mockResolvedValue(undefined),
  estimateTokensFromText: vi.fn().mockReturnValue(100),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 9,
    resetAt: 0,
  }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  DESIGN_RATE_LIMIT: {
    maxAttempts: 10,
    windowMs: 3600000,
  },
}))

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('Designs CRUD API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(createMockSupabase() as never)
  })

  /* ================================================================ */
  /* GET /api/projects/[id]/designs — listar artefactos               */
  /* ================================================================ */

  describe('GET /api/projects/[id]/designs', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { GET } = await import('@/app/api/projects/[id]/designs/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('No autenticado')
    })

    it('lista artefactos de diseno correctamente', async () => {
      const { GET } = await import('@/app/api/projects/[id]/designs/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('artifacts')
      expect(body.artifacts).toHaveLength(2)
      expect(body.artifacts[0]).toHaveProperty('id', 'art-1')
      expect(body.artifacts[1]).toHaveProperty('id', 'art-2')
    })

    it('retorna array vacio cuando no hay artefactos', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({ listResult: { data: [], error: null } }) as never,
      )

      const { GET } = await import('@/app/api/projects/[id]/designs/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.artifacts).toEqual([])
    })

    it('devuelve 500 cuando hay error en la consulta', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          listResult: { data: null, error: new Error('DB error') },
        }) as never,
      )

      const { GET } = await import('@/app/api/projects/[id]/designs/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toContain('Error')
    })
  })

  /* ================================================================ */
  /* GET /api/projects/[id]/designs/[artifactId] — detalle             */
  /* ================================================================ */

  describe('GET /api/projects/[id]/designs/[artifactId]', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { GET } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('No autenticado')
    })

    it('devuelve 404 cuando el artefacto no existe', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          detailResult: { data: null, error: new Error('not found') },
        }) as never,
      )

      const { GET } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', artifactId: 'nonexistent' }),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('Artefacto no encontrado')
    })

    it('retorna artefacto con signed URL para archivos con storage_path', async () => {
      const { GET } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('artifact')
      expect(body.artifact.id).toBe('art-1')
      expect(body).toHaveProperty('signedUrl', 'https://storage.example.com/signed-url')
    })

    it('retorna contenido markdown cuando mime_type es text/markdown', async () => {
      const markdownArtifact = {
        ...mockArtifactDetail,
        mime_type: 'text/markdown',
        storage_path: 'projects/proj-1/designs/art-1.md',
      }

      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          detailResult: { data: markdownArtifact, error: null },
          downloadContent: '# Design Document\nContent here',
        }) as never,
      )

      const { GET } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('artifact')
      expect(body).toHaveProperty('signedUrl')
      expect(body).toHaveProperty('content')
      expect(body.content).toContain('# Design Document')
    })

    it('retorna signedUrl null cuando no hay storage_path', async () => {
      const noPathArtifact = {
        ...mockArtifactDetail,
        storage_path: null,
      }

      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          detailResult: { data: noPathArtifact, error: null },
        }) as never,
      )

      const { GET } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await GET(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.signedUrl).toBeNull()
      expect(body.content).toBeNull()
    })
  })

  /* ================================================================ */
  /* PATCH /api/projects/[id]/designs/[artifactId] — actualizar status */
  /* ================================================================ */

  describe('PATCH /api/projects/[id]/designs/[artifactId]', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { PATCH } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(401)
    })

    it('devuelve 400 con status invalido', async () => {
      const { PATCH } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'invalid_status' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Estado invalido')
    })

    it('devuelve 400 cuando falta el campo status', async () => {
      const { PATCH } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Estado invalido')
    })

    it('actualiza status a "approved" correctamente', async () => {
      const { PATCH } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('id', 'art-1')
      expect(body).toHaveProperty('status', 'approved')
    })

    it('actualiza status a "draft" correctamente', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          patchResult: { data: { id: 'art-1', status: 'draft' }, error: null },
        }) as never,
      )

      const { PATCH } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'draft' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('status', 'draft')
    })

    it('devuelve 500 cuando falla la actualizacion en DB', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          patchResult: { data: null, error: new Error('DB error') },
        }) as never,
      )

      const { PATCH } = await import('@/app/api/projects/[id]/designs/[artifactId]/route')

      const res = await PATCH(
        new Request('http://x', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toContain('Error al actualizar')
    })
  })

  /* ================================================================ */
  /* POST /api/projects/[id]/designs/[artifactId]/refine              */
  /* ================================================================ */

  describe('POST /api/projects/[id]/designs/[artifactId]/refine', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        ...createMockSupabase(),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as never)

      const { POST } = await import('@/app/api/projects/[id]/designs/[artifactId]/refine/route')

      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ instruction: 'Cambiar colores' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(401)
    })

    it('devuelve 429 cuando se excede el rate limit', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limit')
      vi.mocked(checkRateLimit).mockReturnValueOnce({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      })

      const { POST } = await import('@/app/api/projects/[id]/designs/[artifactId]/refine/route')

      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ instruction: 'Cambiar colores' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(429)
      const body = await res.json()
      expect(body.error).toBe('rate_limited')
    })

    it('devuelve 400 con body invalido (sin instruction)', async () => {
      const { POST } = await import('@/app/api/projects/[id]/designs/[artifactId]/refine/route')

      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('invalidos')
    })

    it('devuelve 400 con instruction vacia', async () => {
      const { POST } = await import('@/app/api/projects/[id]/designs/[artifactId]/refine/route')

      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ instruction: '' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(400)
    })

    it('devuelve 404 cuando el artefacto no existe', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          detailResult: { data: null, error: new Error('not found') },
        }) as never,
      )

      const { POST } = await import('@/app/api/projects/[id]/designs/[artifactId]/refine/route')

      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ instruction: 'Cambiar colores' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('Artefacto no encontrado')
    })

    it('devuelve 400 cuando no hay contenido para refinar', async () => {
      vi.mocked(createClient).mockResolvedValueOnce(
        createMockSupabase({
          downloadContent: null,
        }) as never,
      )

      const { POST } = await import('@/app/api/projects/[id]/designs/[artifactId]/refine/route')

      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ instruction: 'Cambiar colores' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('No hay contenido')
    })

    it('refina diseno exitosamente y retorna 200', async () => {
      const { POST } = await import('@/app/api/projects/[id]/designs/[artifactId]/refine/route')

      const res = await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ instruction: 'Cambiar colores a azul' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('artifactId')
    })

    it('llama a generateText y sube resultado a storage', async () => {
      const { generateText } = await import('ai')
      const { buildDesignRefinePrompt } = await import('@/lib/ai/prompts/design-generation')

      const { POST } = await import('@/app/api/projects/[id]/designs/[artifactId]/refine/route')

      await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ instruction: 'Agregar sidebar' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(buildDesignRefinePrompt).toHaveBeenCalled()
      expect(generateText).toHaveBeenCalled()
    })

    it('registra uso de AI despues del refinamiento', async () => {
      const { recordAiUsage } = await import('@/lib/ai/usage')

      const { POST } = await import('@/app/api/projects/[id]/designs/[artifactId]/refine/route')

      await POST(
        new Request('http://x', {
          method: 'POST',
          body: JSON.stringify({ instruction: 'Mejorar layout' }),
          headers: { 'Content-Type': 'application/json' },
        }),
        { params: Promise.resolve({ id: 'proj-1', artifactId: 'art-1' }) },
      )

      expect(recordAiUsage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user-123',
          projectId: 'proj-1',
          eventType: 'design_refine',
        }),
      )
    })
  })
})
