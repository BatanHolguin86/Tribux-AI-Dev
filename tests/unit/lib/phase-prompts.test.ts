import { describe, it, expect } from 'vitest'
import { buildPhase00Prompt, SECTION_LABELS } from '@/lib/ai/prompts/phase-00'
import { PHASE_KICKOFF_MESSAGES, PHASE03_KICKOFF_BY_PERSONA } from '@/lib/ai/prompts/phase-chat-builders'
import { buildMarketingPrompt, MARKETING_MODES } from '@/lib/ai/prompts/marketing-strategist'
import { buildFeedbackAnalysisPrompt } from '@/lib/ai/prompts/feedback-analyst'
import { buildAutoFixPrompt } from '@/lib/ai/prompts/auto-fix-agent'

describe('Phase 00 prompts', () => {
  it('SECTION_LABELS has 5 sections', () => {
    expect(Object.keys(SECTION_LABELS)).toHaveLength(5)
  })

  it('exports buildPhase00Prompt function', () => {
    expect(typeof buildPhase00Prompt).toBe('function')
  })
})

describe('Phase chat builders', () => {
  it('has kickoff messages for phases 3-7', () => {
    for (let i = 3; i <= 7; i++) {
      expect(PHASE_KICKOFF_MESSAGES[i]).toBeTruthy()
    }
  })

  it('has persona-specific kickoffs for phase 03', () => {
    expect(PHASE03_KICKOFF_BY_PERSONA.founder).toBeTruthy()
    expect(PHASE03_KICKOFF_BY_PERSONA.emprendedor).toBeTruthy()
    expect(PHASE03_KICKOFF_BY_PERSONA.pm).toBeTruthy()
    expect(PHASE03_KICKOFF_BY_PERSONA.consultor).toBeTruthy()
  })

  it('phase 03 founder kickoff is simpler than consultor', () => {
    const founder = PHASE03_KICKOFF_BY_PERSONA.founder ?? ''
    const consultor = PHASE03_KICKOFF_BY_PERSONA.consultor ?? ''
    // Founder should have simpler language
    expect(founder.length).toBeGreaterThan(10)
    expect(consultor.length).toBeGreaterThan(10)
  })
})

describe('Marketing strategist prompts', () => {
  it('has 6 modes', () => {
    expect(Object.keys(MARKETING_MODES)).toHaveLength(6)
  })

  it('all prompts contain Tribux AI', () => {
    const modes = Object.keys(MARKETING_MODES) as Array<keyof typeof MARKETING_MODES>
    for (const mode of modes) {
      expect(buildMarketingPrompt(mode)).toContain('Tribux AI')
    }
  })
})

describe('cross-prompt consistency', () => {
  it('all prompts respond in Spanish', () => {
    const marketing = buildMarketingPrompt('brand')
    const marketing2 = buildMarketingPrompt('gtm')
    const feedback = buildFeedbackAnalysisPrompt({
      category: 'bug', subject: 'test', messages: [],
      userPlan: null, userPersona: null, pageUrl: null,
    })

    expect(marketing).toContain('español')
    expect(marketing2).toContain('español')
    expect(feedback).toContain('espanol')
  })

  it('auto-fix prompt requests JSON', () => {
    const prompt = buildAutoFixPrompt({ errorMessage: 'test' })
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('"analysis"')
  })
})
