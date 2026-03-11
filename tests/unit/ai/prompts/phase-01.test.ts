import { describe, it, expect } from 'vitest'
import {
  buildKiroPrompt,
  buildKiroDocGenerationPrompt,
  KIRO_DOC_TYPES,
  KIRO_DOC_LABELS,
} from '@/lib/ai/prompts/phase-01'
import type { KiroDocumentType } from '@/types/feature'

type KiroContext = {
  projectName: string
  description: string | null
  industry: string | null
  persona: string | null
  discoveryDocs: string
  previousSpecs: string
  featureName: string
  featureDescription: string | null
}

const baseContext: KiroContext = {
  projectName: 'Proyecto KIRO',
  description: 'App de gestion',
  industry: 'SaaS',
  persona: 'Product Owner',
  discoveryDocs: '### Brief\nResumen del discovery...',
  previousSpecs: '### Feature Login\nSpecs previos.',
  featureName: 'Autenticacion',
  featureDescription: 'Login con email y contraseña',
}

describe('buildKiroPrompt', () => {
  it('genera prompt para requirements con contexto completo', () => {
    const prompt = buildKiroPrompt('requirements', baseContext)

    expect(prompt).toContain('ROL: Eres el CTO Virtual y Orquestador')
    expect(prompt).toContain('CONTEXTO DEL PROYECTO:')
    expect(prompt).toContain('Nombre: Proyecto KIRO')
    expect(prompt).toContain('Descripcion: App de gestion')
    expect(prompt).toContain('Industria: SaaS')
    expect(prompt).toContain('Perfil del usuario: Product Owner')
    expect(prompt).toContain('DISCOVERY APROBADO:')
    expect(prompt).toContain('### Brief')
    expect(prompt).toContain('SPECS DE FEATURES ANTERIORES:')
    expect(prompt).toContain('Feature Login')
    expect(prompt).toContain('FEATURE ACTIVO: Autenticacion')
    expect(prompt).toContain('Descripcion: Login con email y contraseña')
    expect(prompt).toContain('DOCUMENTO A GENERAR: Requirements')
    expect(prompt).toContain('OBJETIVO:')
    expect(prompt).toContain('User Stories')
    expect(prompt).toContain('[SECTION_READY]')
  })

  it('genera prompt para design con estructura de documento', () => {
    const prompt = buildKiroPrompt('design', baseContext)

    expect(prompt).toContain('DOCUMENTO A GENERAR: Design')
    expect(prompt).toContain('Data Model')
    expect(prompt).toContain('API Design')
    expect(prompt).toContain('Que datos necesita almacenar este feature?')
  })

  it('genera prompt para tasks con instruccion especifica', () => {
    const prompt = buildKiroPrompt('tasks', baseContext)

    expect(prompt).toContain('DOCUMENTO A GENERAR: Tasks')
    expect(prompt).toContain('TASK-XXX')
    expect(prompt).toContain('requirements y design aprobados')
  })

  it('usa placeholders cuando campos opcionales son nulos', () => {
    const context: KiroContext = {
      ...baseContext,
      description: null,
      industry: null,
      persona: null,
      featureDescription: null,
    }
    const prompt = buildKiroPrompt('requirements', context)

    expect(prompt).toContain('Descripcion: No proporcionada')
    expect(prompt).toContain('Industria: No especificada')
    expect(prompt).toContain('Perfil del usuario: No especificado')
  })

  it('incluye discoveryDocs y previousSpecs cuando vacios', () => {
    const context: KiroContext = {
      ...baseContext,
      discoveryDocs: '',
      previousSpecs: '',
    }
    const prompt = buildKiroPrompt('requirements', context)

    expect(prompt).toContain('No disponible')
    expect(prompt).toContain('Este es el primer feature.')
  })

  it.each(KIRO_DOC_TYPES as KiroDocumentType[])(
    'genera prompt valido para tipo %s',
    (docType) => {
      const prompt = buildKiroPrompt(docType, baseContext)

      expect(prompt).toContain('CONTEXTO DEL PROYECTO:')
      expect(prompt).toContain('STACK TECNICO:')
      expect(prompt).toContain('es-LATAM')
      expect(prompt.length).toBeGreaterThan(200)
    }
  )
})

describe('buildKiroDocGenerationPrompt', () => {
  it('genera prompt de documento formal para requirements', () => {
    const prompt = buildKiroDocGenerationPrompt('requirements', baseContext)

    expect(prompt).toContain('ROL: Eres el CTO Virtual de AI Squad Command Center')
    expect(prompt).toContain('CONTEXTO DEL PROYECTO:')
    expect(prompt).toContain('FEATURE: Autenticacion')
    expect(prompt).toContain('DOCUMENTO: Requirements')
    expect(prompt).toContain('ESTRUCTURA:')
    expect(prompt).toContain('User Stories')
  })

  it.each(KIRO_DOC_TYPES as KiroDocumentType[])(
    'genera prompt de documento valido para %s',
    (docType) => {
      const prompt = buildKiroDocGenerationPrompt(docType, baseContext)
      expect(prompt).toContain('Genera en espanol')
      expect(prompt.length).toBeGreaterThan(100)
    }
  )
})

describe('exports', () => {
  it('KIRO_DOC_TYPES contiene los 3 tipos', () => {
    expect(KIRO_DOC_TYPES).toHaveLength(3)
    expect(KIRO_DOC_TYPES).toContain('requirements')
    expect(KIRO_DOC_TYPES).toContain('design')
    expect(KIRO_DOC_TYPES).toContain('tasks')
  })

  it('KIRO_DOC_LABELS tiene label para cada tipo', () => {
    expect(KIRO_DOC_LABELS.requirements).toBe('Requirements')
    expect(KIRO_DOC_LABELS.design).toBe('Design')
    expect(KIRO_DOC_LABELS.tasks).toBe('Tasks')
  })
})
