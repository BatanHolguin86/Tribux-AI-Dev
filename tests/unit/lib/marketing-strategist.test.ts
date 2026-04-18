import { describe, it, expect } from 'vitest'
import { buildMarketingPrompt, MARKETING_MODES } from '@/lib/ai/prompts/marketing-strategist'
import type { MarketingMode } from '@/lib/ai/prompts/marketing-strategist'

describe('marketing strategist prompt', () => {
  it('exports 6 marketing modes', () => {
    const modes = Object.keys(MARKETING_MODES)
    expect(modes).toHaveLength(6)
    expect(modes).toContain('brand')
    expect(modes).toContain('gtm')
    expect(modes).toContain('content')
    expect(modes).toContain('growth')
    expect(modes).toContain('sales')
    expect(modes).toContain('competitive')
  })

  it('each mode has label and description', () => {
    for (const mode of Object.values(MARKETING_MODES)) {
      expect(mode.label).toBeTruthy()
      expect(mode.description).toBeTruthy()
    }
  })

  it('builds prompt with brand mode', () => {
    const prompt = buildMarketingPrompt('brand')
    expect(prompt).toContain('Marketing Strategist')
    expect(prompt).toContain('BRAND STRATEGY')
    expect(prompt).toContain('positioning statement')
    expect(prompt).toContain('Tribux AI')
  })

  it('builds prompt with gtm mode', () => {
    const prompt = buildMarketingPrompt('gtm')
    expect(prompt).toContain('GTM PLAN')
    expect(prompt).toContain('go-to-market')
    expect(prompt).toContain('funnel')
  })

  it('includes Tribux knowledge in all modes', () => {
    const modes: MarketingMode[] = ['brand', 'gtm', 'content', 'growth', 'sales', 'competitive']
    for (const mode of modes) {
      const prompt = buildMarketingPrompt(mode)
      expect(prompt).toContain('Tribux AI')
      expect(prompt).toContain('$49')
      expect(prompt).toContain('$149')
      expect(prompt).toContain('$299')
      expect(prompt).toContain('$699')
      expect(prompt).toContain('Santiago')
      expect(prompt).toContain('Camila')
    }
  })

  it('includes competitor analysis in knowledge', () => {
    const prompt = buildMarketingPrompt('competitive')
    expect(prompt).toContain('Bolt')
    expect(prompt).toContain('Lovable')
    expect(prompt).toContain('Devin')
    expect(prompt).toContain('COMPETITIVE INTELLIGENCE')
  })

  it('includes response format instructions', () => {
    const prompt = buildMarketingPrompt('brand')
    expect(prompt).toContain('Responde siempre en español')
    expect(prompt).toContain('Formato markdown')
    expect(prompt).toContain('Próximos pasos')
  })
})
