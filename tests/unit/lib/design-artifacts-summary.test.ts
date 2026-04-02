/**
 * Unit tests: getDesignArtifactsSummaryForPhase02 (Phase 02 ↔ Design hub correlation).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { getDesignArtifactsSummaryForPhase02 } from '@/lib/ai/context-builder'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('getDesignArtifactsSummaryForPhase02', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty string when no rows', async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })),
    } as never)

    const out = await getDesignArtifactsSummaryForPhase02('p1')
    expect(out).toBe('')
  })

  it('returns markdown lines with screen names and HTML stripped from preview', async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  screen_name: 'Dashboard',
                  type: 'mockup_lowfi',
                  status: 'draft',
                  flow_name: 'Onboarding',
                  content: '<div><p>Hello <b>world</b></p></div>',
                },
              ],
              error: null,
            }),
          }),
        }),
      })),
    } as never)

    const out = await getDesignArtifactsSummaryForPhase02('p1')
    expect(out).toContain('**Dashboard**')
    expect(out).toContain('mockup_lowfi')
    expect(out).toContain('flujo: Onboarding')
    expect(out).toMatch(/Hello\s+world/i)
    expect(out).not.toContain('<div>')
  })
})
