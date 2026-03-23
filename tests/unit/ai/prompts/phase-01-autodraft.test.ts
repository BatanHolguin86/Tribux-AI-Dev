import { describe, it, expect } from 'vitest'
import {
  buildKiroAutoDraftPrompt,
  buildKiroDocGenerationPrompt,
  buildKiroPrompt,
} from '@/lib/ai/prompts/phase-01'
import type { KiroContext } from '@/lib/ai/prompts/phase-01'

const baseContext: KiroContext = {
  projectName: 'Proyecto Test',
  description: 'App de gestion de tareas',
  industry: 'SaaS',
  persona: 'Product Owner',
  discoveryDocs: '### Brief\nDescripcion del discovery...',
  previousSpecs: '### Feature Login\nSpecs previos.',
  featureName: 'Dashboard',
  featureDescription: 'Panel principal con metricas',
}

describe('buildKiroAutoDraftPrompt', () => {
  it('genera prompt auto-draft para requirements sin conversacion previa', () => {
    const prompt = buildKiroAutoDraftPrompt('requirements', baseContext, '')

    expect(prompt).toContain('SIN conversacion previa')
    expect(prompt).toContain('Nombre: Proyecto Test')
    expect(prompt).toContain('FEATURE: Dashboard')
    expect(prompt).toContain('Descripcion: Panel principal con metricas')
    expect(prompt).toContain('DOCUMENTO: Requirements')
    expect(prompt).toContain('User Stories')
    expect(prompt).toContain('Resumen para ti')
  })

  it('genera prompt auto-draft para tasks con notas de especialistas', () => {
    const specialistNotes = '## Lead Developer\n- Task 1: Setup DB\n- Task 2: Create API'
    const prompt = buildKiroAutoDraftPrompt('tasks', baseContext, specialistNotes)

    expect(prompt).toContain('NOTAS DE ESPECIALISTAS')
    expect(prompt).toContain('Lead Developer')
    expect(prompt).toContain('Setup DB')
    expect(prompt).toContain('DOCUMENTO: Tasks')
    expect(prompt).toContain('TASK-XXX')
  })

  it('incluye contexto del proyecto completo', () => {
    const prompt = buildKiroAutoDraftPrompt('requirements', baseContext, '')

    expect(prompt).toContain('DISCOVERY APROBADO:')
    expect(prompt).toContain('### Brief')
    expect(prompt).toContain('SPECS PREVIOS:')
    expect(prompt).toContain('Feature Login')
    expect(prompt).toContain('Industria: SaaS')
    expect(prompt).toContain('Perfil del usuario: Product Owner')
  })

  it('no incluye notas de especialistas cuando estan vacias', () => {
    const prompt = buildKiroAutoDraftPrompt('requirements', baseContext, '')

    expect(prompt).not.toContain('NOTAS DE ESPECIALISTAS')
  })

  it('incluye instruccion de no generar codigo fuente', () => {
    const prompt = buildKiroAutoDraftPrompt('requirements', baseContext, '')

    expect(prompt).toContain('NUNCA generes codigo fuente')
  })

  it('incluye instruccion de Resumen para ti', () => {
    const prompt = buildKiroAutoDraftPrompt('tasks', baseContext, '')

    expect(prompt).toContain('Resumen para ti')
    expect(prompt).toContain('lenguaje NO tecnico')
  })

  it('usa placeholders cuando contexto es nulo', () => {
    const emptyContext: KiroContext = {
      ...baseContext,
      description: null,
      industry: null,
      persona: null,
      featureDescription: null,
      discoveryDocs: '',
      previousSpecs: '',
    }
    const prompt = buildKiroAutoDraftPrompt('requirements', emptyContext, '')

    expect(prompt).toContain('Descripcion: No proporcionada')
    expect(prompt).toContain('Industria: No especificada')
    expect(prompt).toContain('Perfil del usuario: No especificado')
  })

  it('design auto-draft no incluye TASK-XXX', () => {
    const prompt = buildKiroAutoDraftPrompt('design', baseContext, '')

    expect(prompt).toContain('No incluyas checklist TASK-001')
  })

  it('tasks auto-draft no duplica Design completo', () => {
    const prompt = buildKiroAutoDraftPrompt('tasks', baseContext, '')

    expect(prompt).toContain('No dupliques el Design completo')
  })
})

describe('CTO efficiency rules in chat prompt', () => {
  it('requirements chat prompt includes efficiency rules', () => {
    const prompt = buildKiroPrompt('requirements', baseContext)

    expect(prompt).toContain('REGLAS DE EFICIENCIA CTO')
    expect(prompt).toContain('NUNCA generes codigo fuente')
    expect(prompt).toContain('MAXIMO 3 turnos')
    expect(prompt).toContain('CERO menciones de fases futuras')
  })

  it('design chat prompt includes compact proposal instructions', () => {
    const prompt = buildKiroPrompt('design', baseContext)

    expect(prompt).toContain('PROPUESTA COMPACTA')
    expect(prompt).toContain('Overview')
    expect(prompt).toContain('Modelo de datos')
    expect(prompt).toContain('APIs')
    expect(prompt).toContain('decisiones arquitectonicas')
    expect(prompt).toContain('Alineado?')
  })

  it('tasks chat prompt includes auto-draft mode instructions', () => {
    const prompt = buildKiroPrompt('tasks', baseContext)

    expect(prompt).toContain('AUTO-DRAFT')
    expect(prompt).toContain('TASK-001')
  })
})

describe('Resumen para ti in document generation prompt', () => {
  it('generation prompt includes Resumen para ti instruction', () => {
    const prompt = buildKiroDocGenerationPrompt('requirements', baseContext)

    expect(prompt).toContain('Resumen para ti')
    expect(prompt).toContain('lenguaje NO tecnico')
  })

  it('generation prompt forbids source code', () => {
    const prompt = buildKiroDocGenerationPrompt('design', baseContext)

    expect(prompt).toContain('NUNCA generes codigo fuente')
  })
})

describe('output structure includes Resumen para ti section', () => {
  it.each(['requirements', 'design', 'tasks'] as const)(
    '%s structure has Resumen para ti',
    (docType) => {
      const prompt = buildKiroPrompt(docType, baseContext)

      expect(prompt).toContain('## Resumen para ti')
    },
  )
})
