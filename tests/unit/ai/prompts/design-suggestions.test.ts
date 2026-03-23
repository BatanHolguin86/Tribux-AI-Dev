import { describe, it, expect } from 'vitest'
import {
  buildDesignGenerationPrompt,
  buildDesignRefinePrompt,
} from '@/lib/ai/prompts/design-generation'
import { buildFeatureSuggestionsPrompt } from '@/lib/ai/prompts/feature-suggestions'
import type { DesignType } from '@/types/design'

// =============================================================================
// Design Generation Prompt
// =============================================================================

type DesignGenerationContext = {
  projectName: string
  screens: string[]
  type: DesignType
  featureSpecs: string
  discoveryDocs: string
  refinement?: string
}

const baseDesignContext: DesignGenerationContext = {
  projectName: 'MyDesignApp',
  screens: ['Login', 'Dashboard', 'Profile'],
  type: 'wireframe',
  featureSpecs: '### Auth Feature\nLogin with email and password.',
  discoveryDocs: '### Discovery\nA project management tool for startups.',
}

describe('buildDesignGenerationPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildDesignGenerationPrompt(baseDesignContext)
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('includes the HTML design base prompt', () => {
    const prompt = buildDesignGenerationPrompt(baseDesignContext)
    expect(prompt).toContain('disenador UI/UX experto')
    expect(prompt).toContain('<!DOCTYPE html>')
  })

  it('injects the project name', () => {
    const prompt = buildDesignGenerationPrompt(baseDesignContext)
    expect(prompt).toContain('PROYECTO: "MyDesignApp"')
  })

  it('lists all screens as a numbered list', () => {
    const prompt = buildDesignGenerationPrompt(baseDesignContext)
    expect(prompt).toContain('1. Login')
    expect(prompt).toContain('2. Dashboard')
    expect(prompt).toContain('3. Profile')
  })

  it('includes wireframe type instructions for wireframe type', () => {
    const prompt = buildDesignGenerationPrompt(baseDesignContext)
    expect(prompt).toContain('Wireframe')
    expect(prompt).toContain('ESTRUCTURA y LAYOUT')
  })

  it('includes mockup_lowfi type instructions', () => {
    const ctx: DesignGenerationContext = { ...baseDesignContext, type: 'mockup_lowfi' }
    const prompt = buildDesignGenerationPrompt(ctx)
    expect(prompt).toContain('Mockup Low-Fidelity')
    expect(prompt).toContain('COLOR SYSTEM')
    expect(prompt).toContain('COMPONENTES REQUERIDOS')
  })

  it('includes mockup_highfi type instructions', () => {
    const ctx: DesignGenerationContext = { ...baseDesignContext, type: 'mockup_highfi' }
    const prompt = buildDesignGenerationPrompt(ctx)
    expect(prompt).toContain('Mockup High-Fidelity')
    expect(prompt).toContain('PALETA DE COLORES COMPLETA')
    expect(prompt).toContain('COMPONENTES PREMIUM')
    expect(prompt).toContain('MICRO-INTERACCIONES')
  })

  it('includes discovery docs when provided', () => {
    const prompt = buildDesignGenerationPrompt(baseDesignContext)
    expect(prompt).toContain('CONTEXTO DEL PROYECTO')
    expect(prompt).toContain('project management tool for startups')
  })

  it('omits discovery docs when empty', () => {
    const ctx: DesignGenerationContext = { ...baseDesignContext, discoveryDocs: '' }
    const prompt = buildDesignGenerationPrompt(ctx)
    expect(prompt).not.toContain('CONTEXTO DEL PROYECTO')
  })

  it('includes feature specs when provided', () => {
    const prompt = buildDesignGenerationPrompt(baseDesignContext)
    expect(prompt).toContain('SPECS DE FEATURES')
    expect(prompt).toContain('Auth Feature')
  })

  it('omits feature specs when empty', () => {
    const ctx: DesignGenerationContext = { ...baseDesignContext, featureSpecs: '' }
    const prompt = buildDesignGenerationPrompt(ctx)
    expect(prompt).not.toContain('SPECS DE FEATURES')
  })

  it('includes refinement instructions when provided', () => {
    const ctx: DesignGenerationContext = {
      ...baseDesignContext,
      refinement: 'Use dark theme with blue accents',
    }
    const prompt = buildDesignGenerationPrompt(ctx)
    expect(prompt).toContain('INSTRUCCIONES ADICIONALES DEL USUARIO')
    expect(prompt).toContain('Use dark theme with blue accents')
  })

  it('omits refinement section when not provided', () => {
    const prompt = buildDesignGenerationPrompt(baseDesignContext)
    expect(prompt).not.toContain('INSTRUCCIONES ADICIONALES DEL USUARIO')
  })

  it('includes HTML structure instructions', () => {
    const prompt = buildDesignGenerationPrompt(baseDesignContext)
    expect(prompt).toContain('tailwindcss.com')
    expect(prompt).toContain('Google Fonts')
    expect(prompt).toContain('Inter')
    expect(prompt).toContain('mobile')
  })

  it('includes instruction about realistic content', () => {
    const prompt = buildDesignGenerationPrompt(baseDesignContext)
    expect(prompt).toContain('REALISTA')
    expect(prompt).toContain('Maria Garcia')
  })

  it('handles a single screen', () => {
    const ctx: DesignGenerationContext = {
      ...baseDesignContext,
      screens: ['Home'],
    }
    const prompt = buildDesignGenerationPrompt(ctx)
    expect(prompt).toContain('1. Home')
    expect(prompt).not.toContain('2.')
  })

  it('handles many screens', () => {
    const ctx: DesignGenerationContext = {
      ...baseDesignContext,
      screens: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    }
    const prompt = buildDesignGenerationPrompt(ctx)
    expect(prompt).toContain('7. G')
  })

  it('truncates long discovery docs to max 4000 chars', () => {
    const longDocs = 'A'.repeat(5000)
    const ctx: DesignGenerationContext = { ...baseDesignContext, discoveryDocs: longDocs }
    const prompt = buildDesignGenerationPrompt(ctx)
    // The slice(0, 4000) should have been applied
    expect(prompt).not.toContain('A'.repeat(5000))
    expect(prompt).toContain('A'.repeat(4000))
  })

  it('truncates long feature specs to max 4000 chars', () => {
    const longSpecs = 'B'.repeat(5000)
    const ctx: DesignGenerationContext = { ...baseDesignContext, featureSpecs: longSpecs }
    const prompt = buildDesignGenerationPrompt(ctx)
    expect(prompt).not.toContain('B'.repeat(5000))
    expect(prompt).toContain('B'.repeat(4000))
  })
})

// =============================================================================
// Design Refine Prompt
// =============================================================================

describe('buildDesignRefinePrompt', () => {
  const baseRefineCtx = {
    projectName: 'MyDesignApp',
    existingContent: '<html><body>Existing design</body></html>',
    instruction: 'Make the header bigger and add a sidebar',
  }

  it('returns a non-empty string', () => {
    const prompt = buildDesignRefinePrompt(baseRefineCtx)
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(50)
  })

  it('includes the HTML design base prompt', () => {
    const prompt = buildDesignRefinePrompt(baseRefineCtx)
    expect(prompt).toContain('disenador UI/UX experto')
    expect(prompt).toContain('<!DOCTYPE html>')
  })

  it('injects the project name', () => {
    const prompt = buildDesignRefinePrompt(baseRefineCtx)
    expect(prompt).toContain('"MyDesignApp"')
  })

  it('includes the existing HTML content', () => {
    const prompt = buildDesignRefinePrompt(baseRefineCtx)
    expect(prompt).toContain('DISENO HTML ACTUAL')
    expect(prompt).toContain('Existing design')
  })

  it('includes the user instruction', () => {
    const prompt = buildDesignRefinePrompt(baseRefineCtx)
    expect(prompt).toContain('CAMBIOS PEDIDOS POR EL USUARIO')
    expect(prompt).toContain('Make the header bigger and add a sidebar')
  })

  it('instructs to output full HTML', () => {
    const prompt = buildDesignRefinePrompt(baseRefineCtx)
    expect(prompt).toContain('HTML COMPLETO actualizado')
    expect(prompt).toContain('</html>')
  })
})

// =============================================================================
// Feature Suggestions Prompt
// =============================================================================

describe('buildFeatureSuggestionsPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildFeatureSuggestionsPrompt('TestApp', '### Discovery docs content')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(50)
  })

  it('includes the CTO Virtual role', () => {
    const prompt = buildFeatureSuggestionsPrompt('TestApp', 'docs')
    expect(prompt).toContain('CTO Virtual de AI Squad')
  })

  it('injects the project name', () => {
    const prompt = buildFeatureSuggestionsPrompt('MyProject', 'docs')
    expect(prompt).toContain('PROYECTO: MyProject')
  })

  it('injects the discovery docs', () => {
    const docs = '### Problem Statement\nThe problem is X and the users are Y.'
    const prompt = buildFeatureSuggestionsPrompt('TestApp', docs)
    expect(prompt).toContain('DISCOVERY APROBADO:')
    expect(prompt).toContain('The problem is X and the users are Y.')
  })

  it('requests between 3 and 6 features', () => {
    const prompt = buildFeatureSuggestionsPrompt('TestApp', 'docs')
    expect(prompt).toContain('3')
    expect(prompt).toContain('6')
    expect(prompt).toContain('features')
  })

  it('specifies MVP focus', () => {
    const prompt = buildFeatureSuggestionsPrompt('TestApp', 'docs')
    expect(prompt).toContain('MVP')
  })

  it('requests JSON response format', () => {
    const prompt = buildFeatureSuggestionsPrompt('TestApp', 'docs')
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('"features"')
    expect(prompt).toContain('"name"')
    expect(prompt).toContain('"description"')
    expect(prompt).toContain('"priority"')
  })

  it('instructs to respond only with JSON', () => {
    const prompt = buildFeatureSuggestionsPrompt('TestApp', 'docs')
    expect(prompt).toContain('SOLO con el JSON')
  })

  it('mentions Auth/Onboarding feature suggestion', () => {
    const prompt = buildFeatureSuggestionsPrompt('TestApp', 'docs')
    expect(prompt).toContain('Auth/Onboarding')
  })

  it('requests Spanish communication', () => {
    const prompt = buildFeatureSuggestionsPrompt('TestApp', 'docs')
    expect(prompt).toMatch(/espa[nñ]ol/i)
  })

  it('handles empty project name gracefully', () => {
    const prompt = buildFeatureSuggestionsPrompt('', 'docs')
    expect(prompt).toContain('PROYECTO: ')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(50)
  })

  it('handles empty discovery docs gracefully', () => {
    const prompt = buildFeatureSuggestionsPrompt('TestApp', '')
    expect(prompt).toContain('DISCOVERY APROBADO:')
    expect(typeof prompt).toBe('string')
  })
})
