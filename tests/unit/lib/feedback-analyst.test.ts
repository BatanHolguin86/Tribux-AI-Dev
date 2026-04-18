import { describe, it, expect } from 'vitest'
import { buildFeedbackAnalysisPrompt } from '@/lib/ai/prompts/feedback-analyst'

describe('feedback analyst prompt builder', () => {
  it('builds prompt with bug category', () => {
    const prompt = buildFeedbackAnalysisPrompt({
      category: 'bug',
      subject: 'Error al guardar proyecto',
      messages: [{ sender_type: 'user', content: 'No puedo guardar mi proyecto, sale error 500' }],
      userPlan: 'builder',
      userPersona: 'founder',
      pageUrl: '/projects/abc/phase/04',
    })

    expect(prompt).toContain('bug')
    expect(prompt).toContain('Error al guardar proyecto')
    expect(prompt).toContain('builder')
    expect(prompt).toContain('founder')
    expect(prompt).toContain('Causa raiz probable')
    expect(prompt).toContain('Pasos para reproducir')
  })

  it('builds prompt with mejora category', () => {
    const prompt = buildFeedbackAnalysisPrompt({
      category: 'mejora',
      subject: 'Agregar dark mode',
      messages: [{ sender_type: 'user', content: 'Me gustaria tener dark mode' }],
      userPlan: 'starter',
      userPersona: 'emprendedor',
      pageUrl: null,
    })

    expect(prompt).toContain('mejora')
    expect(prompt).toContain('Valor para el usuario')
    expect(prompt).toContain('Esfuerzo estimado')
    expect(prompt).not.toContain('Causa raiz probable')
  })

  it('builds prompt with pricing category', () => {
    const prompt = buildFeedbackAnalysisPrompt({
      category: 'pricing',
      subject: 'El plan es muy caro',
      messages: [{ sender_type: 'user', content: '$149 es mucho para mi' }],
      userPlan: 'builder',
      userPersona: 'pm',
      pageUrl: '/settings',
    })

    expect(prompt).toContain('pricing')
    expect(prompt).toContain('Sentimiento')
    expect(prompt).toContain('Impacto en revenue')
  })

  it('builds prompt with otro category', () => {
    const prompt = buildFeedbackAnalysisPrompt({
      category: 'otro',
      subject: 'Pregunta general',
      messages: [{ sender_type: 'user', content: 'Como funciona el auto-build?' }],
      userPlan: null,
      userPersona: null,
      pageUrl: null,
    })

    expect(prompt).toContain('otro')
    expect(prompt).toContain('Tipo real')
    expect(prompt).toContain('desconocido')
  })

  it('includes conversation history', () => {
    const prompt = buildFeedbackAnalysisPrompt({
      category: 'bug',
      subject: 'Test',
      messages: [
        { sender_type: 'user', content: 'Primer mensaje' },
        { sender_type: 'admin', content: 'Respuesta admin' },
        { sender_type: 'user', content: 'Segundo mensaje' },
      ],
      userPlan: null,
      userPersona: null,
      pageUrl: null,
    })

    expect(prompt).toContain('[Usuario]: Primer mensaje')
    expect(prompt).toContain('[Admin]: Respuesta admin')
    expect(prompt).toContain('[Usuario]: Segundo mensaje')
  })
})
