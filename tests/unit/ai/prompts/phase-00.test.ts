import { describe, it, expect } from 'vitest'
import {
  buildPhase00Prompt,
  buildDocumentGenerationPrompt,
  PHASE00_SECTIONS,
  SECTION_LABELS,
  SECTION_DOC_NAMES,
} from '@/lib/ai/prompts/phase-00'
import type { Phase00Section } from '@/types/conversation'
import type { ProjectContext } from '@/lib/ai/context-builder'

const baseContext: ProjectContext = {
  name: 'Mi Proyecto Test',
  description: 'Descripcion del proyecto',
  industry: 'Fintech',
  persona: 'CEO no tecnico',
  approvedSections: [],
}

describe('buildPhase00Prompt', () => {
  it('genera prompt para problem_statement con contexto completo', () => {
    const prompt = buildPhase00Prompt('problem_statement', baseContext)

    expect(prompt).toContain('ROL: Eres el CTO Virtual de AI Squad')
    expect(prompt).toContain('CONTEXTO DEL PROYECTO:')
    expect(prompt).toContain('Nombre: Mi Proyecto Test')
    expect(prompt).toContain('Descripcion: Descripcion del proyecto')
    expect(prompt).toContain('Industria: Fintech')
    expect(prompt).toContain('Perfil del usuario: CEO no tecnico')
    expect(prompt).toContain('SECCION: Problem Statement & Brief')
    expect(prompt).toContain('OBJETIVO:')
    expect(prompt).toContain('Contame en 2-3 parrafos')
    expect(prompt).toContain('[SECTION_READY]')
  })

  it('incluye secciones aprobadas cuando existen', () => {
    const context: ProjectContext = {
      ...baseContext,
      approvedSections: ['Problem Statement', 'User Personas'],
    }
    const prompt = buildPhase00Prompt('value_proposition', context)

    expect(prompt).toContain(
      'SECCIONES YA APROBADAS EN DISCOVERY: Problem Statement, User Personas'
    )
    expect(prompt).toContain('Usa toda la informacion de estas secciones como base')
  })

  it('no incluye secciones aprobadas cuando esta vacio', () => {
    const prompt = buildPhase00Prompt('personas', baseContext)

    expect(prompt).not.toContain('SECCIONES APROBADAS PREVIAMENTE')
  })

  it('usa placeholders para campos opcionales nulos', () => {
    const context: ProjectContext = {
      ...baseContext,
      description: null,
      industry: null,
      persona: null,
    }
    const prompt = buildPhase00Prompt('problem_statement', context)

    expect(prompt).toContain('Descripcion: No proporcionada aun')
    expect(prompt).toContain('Industria: No especificada')
    expect(prompt).toContain('Perfil del usuario: No especificado')
  })

  it.each(PHASE00_SECTIONS as Phase00Section[])(
    'genera prompt valido para seccion %s',
    (section) => {
      const prompt = buildPhase00Prompt(section, baseContext)

      expect(prompt).toContain('CONTEXTO DEL PROYECTO:')
      expect(prompt).toContain('FASE ACTIVA:')
      expect(prompt).toContain('es-LATAM')
      expect(prompt.length).toBeGreaterThan(200)
    }
  )
})

describe('buildDocumentGenerationPrompt', () => {
  it('genera prompt de documento con estructura para problem_statement', () => {
    const prompt = buildDocumentGenerationPrompt('problem_statement', baseContext)

    expect(prompt).toContain('ROL: Eres el CTO Virtual de AI Squad')
    expect(prompt).toContain('CONTEXTO DEL PROYECTO:')
    expect(prompt).toContain('SECCION: Problem Statement & Brief')
    expect(prompt).toContain('# Brief del Producto')
    expect(prompt).toContain('## Problem Statement')
    expect(prompt).toContain('ESTRUCTURA REQUERIDA:')
  })

  it.each(PHASE00_SECTIONS as Phase00Section[])(
    'genera prompt de documento valido para %s',
    (section) => {
      const prompt = buildDocumentGenerationPrompt(section, baseContext)
      expect(prompt).toContain('Genera el documento en espanol')
      expect(prompt.length).toBeGreaterThan(100)
    }
  )
})

describe('exports', () => {
  it('PHASE00_SECTIONS contiene las 5 secciones', () => {
    expect(PHASE00_SECTIONS).toHaveLength(5)
    expect(PHASE00_SECTIONS).toContain('problem_statement')
    expect(PHASE00_SECTIONS).toContain('personas')
    expect(PHASE00_SECTIONS).toContain('value_proposition')
    expect(PHASE00_SECTIONS).toContain('metrics')
    expect(PHASE00_SECTIONS).toContain('competitive_analysis')
  })

  it('SECTION_LABELS tiene label para cada seccion', () => {
    expect(SECTION_LABELS.problem_statement).toBe('Problem Statement')
    expect(SECTION_LABELS.personas).toBe('User Personas')
    expect(SECTION_LABELS.value_proposition).toBe('Value Proposition')
    expect(SECTION_LABELS.metrics).toBe('Success Metrics')
    expect(SECTION_LABELS.competitive_analysis).toBe('Competitive Analysis')
  })

  it('SECTION_DOC_NAMES tiene nombre de archivo para cada seccion', () => {
    expect(SECTION_DOC_NAMES.problem_statement).toBe('01-brief.md')
    expect(SECTION_DOC_NAMES.metrics).toBe('04-metrics.md')
  })
})
