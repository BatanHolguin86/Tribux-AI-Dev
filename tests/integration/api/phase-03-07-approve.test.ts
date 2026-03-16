import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockUpdatePhaseSections = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
})

const mockUpdateProjectPhases = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
})

const mockUpdateProjects = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

const phaseSections: Record<number, { section: string; status: string }[]> = {
  3: [
    { section: 'repository', status: 'approved' },
    { section: 'database', status: 'approved' },
    { section: 'authentication', status: 'approved' },
    { section: 'hosting', status: 'approved' },
    { section: 'environment_variables', status: 'approved' },
    { section: 'verification', status: 'approved' },
  ],
  4: [],
  5: [
    { section: 'test_plan', status: 'approved' },
    { section: 'unit_tests', status: 'approved' },
    { section: 'integration_tests', status: 'approved' },
    { section: 'e2e_tests', status: 'approved' },
    { section: 'qa_report', status: 'approved' },
  ],
  6: [
    { section: 'deploy_production', status: 'approved' },
    { section: 'monitoring_alerts', status: 'approved' },
    { section: 'documentation', status: 'approved' },
    { section: 'launch_checklist', status: 'approved' },
  ],
  7: [
    { section: 'feedback', status: 'approved' },
    { section: 'metrics', status: 'approved' },
    { section: 'backlog', status: 'approved' },
    { section: 'retrospective', status: 'approved' },
  ],
}

const createMockFrom = (phaseNumber: number) => {
  return vi.fn((table: string) => {
    if (table === 'phase_sections') {
      const select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: phaseSections[phaseNumber] ?? [],
            error: null,
          }),
        }),
      })
      return {
        select,
        update: mockUpdatePhaseSections,
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    if (table === 'feature_documents') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }
    }
    if (table === 'project_phases') {
      return { update: mockUpdateProjectPhases }
    }
    if (table === 'projects') {
      return { update: mockUpdateProjects }
    }
    if (table === 'project_tasks') {
      const eqResult = { data: [{ id: 'task-1', status: 'done' }], error: null }
      const select = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(eqResult),
      })
      return {
        select,
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    return {}
  })
}

const createMockSupabase = (phaseNumber: number) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    }),
  },
  from: createMockFrom(phaseNumber),
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/tasks/parse-tasks', () => ({
  parseTasksFromMarkdown: vi.fn().mockReturnValue([]),
}))

vi.mock('@/lib/ai/prompts/phase-05', () => ({
  PHASE05_SECTIONS: ['test_plan', 'unit_tests', 'integration_tests', 'e2e_tests', 'qa_report'],
}))

vi.mock('@/lib/ai/prompts/phase-06', () => ({
  PHASE06_SECTIONS: ['deploy_production', 'monitoring_alerts', 'documentation', 'launch_checklist'],
}))

vi.mock('@/lib/ai/prompts/phase-07', () => ({
  PHASE07_SECTIONS: ['feedback', 'metrics', 'backlog', 'retrospective'],
}))

describe('Phase 03-07 approval flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/projects/[id]/phases/3/approve', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      const mock = createMockSupabase(3)
      mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
      vi.mocked(createClient).mockResolvedValueOnce(mock as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/3/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(401)
    })

    it('completa phase 03 y desbloquea phase 04', async () => {
      vi.mocked(createClient).mockResolvedValue(createMockSupabase(3) as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/3/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({
        phase: 3,
        status: 'completed',
        next_phase: 4,
        unlocked: true,
      })

      expect(mockUpdateProjectPhases).toHaveBeenCalledTimes(2)
      expect(mockUpdateProjects).toHaveBeenCalledWith(
        expect.objectContaining({ current_phase: 4 })
      )
    })
  })

  describe('POST /api/projects/[id]/phases/4/approve', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      const mock = createMockSupabase(4)
      mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
      vi.mocked(createClient).mockResolvedValueOnce(mock as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/4/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(401)
    })

    it('completa phase 04 y desbloquea phase 05', async () => {
      vi.mocked(createClient).mockResolvedValue(createMockSupabase(4) as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/4/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({
        phase: 4,
        status: 'completed',
        next_phase: 5,
        unlocked: true,
      })

      expect(mockUpdateProjectPhases).toHaveBeenCalledTimes(2)
      expect(mockUpdateProjects).toHaveBeenCalledWith(
        expect.objectContaining({ current_phase: 5 })
      )
    })
  })

  describe('POST /api/projects/[id]/phases/5/approve', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      const mock = createMockSupabase(5)
      mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
      vi.mocked(createClient).mockResolvedValueOnce(mock as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/5/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(401)
    })

    it('completa phase 05 y desbloquea phase 06', async () => {
      vi.mocked(createClient).mockResolvedValue(createMockSupabase(5) as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/5/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({
        phase: 5,
        status: 'completed',
        next_phase: 6,
        unlocked: true,
      })

      expect(mockUpdateProjectPhases).toHaveBeenCalledTimes(2)
      expect(mockUpdateProjects).toHaveBeenCalledWith(
        expect.objectContaining({ current_phase: 6 })
      )
    })
  })

  describe('POST /api/projects/[id]/phases/6/approve', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      const mock = createMockSupabase(6)
      mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
      vi.mocked(createClient).mockResolvedValueOnce(mock as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/6/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(401)
    })

    it('completa phase 06 y desbloquea phase 07', async () => {
      vi.mocked(createClient).mockResolvedValue(createMockSupabase(6) as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/6/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({
        phase: 6,
        status: 'completed',
        next_phase: 7,
        unlocked: true,
      })

      expect(mockUpdateProjectPhases).toHaveBeenCalledTimes(2)
      expect(mockUpdateProjects).toHaveBeenCalledWith(
        expect.objectContaining({ current_phase: 7 })
      )
    })
  })

  describe('POST /api/projects/[id]/phases/7/approve', () => {
    it('devuelve 401 sin usuario autenticado', async () => {
      const mock = createMockSupabase(7)
      mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
      vi.mocked(createClient).mockResolvedValueOnce(mock as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/7/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(401)
    })

    it('completa phase 07 (fase final)', async () => {
      vi.mocked(createClient).mockResolvedValue(createMockSupabase(7) as never)

      const { POST } = await import('@/app/api/projects/[id]/phases/7/approve/route')

      const res = await POST(new Request('http://x'), {
        params: Promise.resolve({ id: 'proj-1' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.phase).toBe(7)
      expect(body.status).toBe('completed')
    })
  })
})
