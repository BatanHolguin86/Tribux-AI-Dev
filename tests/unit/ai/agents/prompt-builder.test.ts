import { describe, it, expect } from 'vitest'
import { buildAgentPrompt, buildSuggestionsPrompt } from '@/lib/ai/agents/prompt-builder'
import type { AgentType } from '@/types/agent'
import type { FullProjectContext } from '@/lib/ai/agents/prompt-builder'

const baseContext: FullProjectContext = {
  name: 'Proyecto Agentes',
  description: 'App de prueba',
  industry: 'SaaS',
  persona: 'Product Owner',
  currentPhase: 2,
  phaseName: 'Architecture & Design',
  discoveryDocs: '### Brief\nDiscovery aprobado...',
  featureSpecs: '### Feature Login\nSpecs...',
  artifacts: '### Artifact 1\nContenido...',
}

const AGENT_TYPES: AgentType[] = [
  'cto_virtual',
  'product_architect',
  'system_architect',
  'ui_ux_designer',
  'lead_developer',
  'db_admin',
  'qa_engineer',
  'devops_engineer',
]

describe('buildAgentPrompt', () => {
  it.each(AGENT_TYPES)(
    'incluye rol, contexto del proyecto e instrucciones para %s',
    (agentType) => {
      const prompt = buildAgentPrompt(agentType, baseContext)

      expect(prompt).toContain('ROL:')
      expect(prompt).toContain('CONTEXTO DEL PROYECTO:')
      expect(prompt).toContain('Nombre: Proyecto Agentes')
      expect(prompt).toContain('Descripcion: App de prueba')
      expect(prompt).toContain('Industria: SaaS')
      expect(prompt).toContain('Phase 02 — Architecture & Design')
      expect(prompt).toContain('Perfil del usuario: Product Owner')
      expect(prompt).toContain('DOCUMENTOS DEL PROYECTO:')
      expect(prompt).toContain('### Discovery')
      expect(prompt).toContain('Discovery aprobado')
      expect(prompt).toContain('### Specs de Features')
      expect(prompt).toContain('### Artifacts')
      expect(prompt.length).toBeGreaterThan(300)
    }
  )

  it('CTO Virtual incluye delegacion a agentes especializados', () => {
    const prompt = buildAgentPrompt('cto_virtual', baseContext)
    expect(prompt).toContain('Product Architect')
    expect(prompt).toContain('Lead Developer')
    expect(prompt).toContain('DB Admin')
    expect(prompt).toContain('Delegacion')
  })

  it('Lead Developer incluye instrucciones de codigo', () => {
    const prompt = buildAgentPrompt('lead_developer', baseContext)
    expect(prompt).toContain('code blocks')
    expect(prompt).toContain('TypeScript')
  })

  it('usa placeholders cuando contexto es vacio', () => {
    const emptyContext: FullProjectContext = {
      ...baseContext,
      description: null,
      industry: null,
      persona: null,
      discoveryDocs: '',
      featureSpecs: '',
      artifacts: '',
    }
    const prompt = buildAgentPrompt('cto_virtual', emptyContext)

    expect(prompt).toContain('Descripcion: No proporcionada')
    expect(prompt).toContain('Industria: No especificada')
    expect(prompt).toContain('Perfil del usuario: No especificado')
    expect(prompt).toContain('No hay documentos de discovery aprobados')
    expect(prompt).toContain('No hay specs de features aprobados')
    expect(prompt).toContain('No hay artifacts guardados')
  })
})

describe('buildSuggestionsPrompt', () => {
  it('genera prompt de sugerencias con contexto del proyecto', () => {
    const prompt = buildSuggestionsPrompt(baseContext)

    expect(prompt).toContain('ROL: Eres el asistente de AI Squad Command Center')
    expect(prompt).toContain('CONTEXTO DEL PROYECTO:')
    expect(prompt).toContain('Nombre: Proyecto Agentes')
    expect(prompt).toContain('Phase 02')
    expect(prompt).toContain('sugerencias')
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('suggestions')
  })
})
