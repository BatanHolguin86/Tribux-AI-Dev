import type { AgentType } from '@/types/agent'
import { CTO_VIRTUAL_PROMPT } from './cto-virtual'
import { PRODUCT_ARCHITECT_PROMPT } from './product-architect'
import { SYSTEM_ARCHITECT_PROMPT } from './system-architect'
import { UI_UX_DESIGNER_PROMPT } from './ui-ux-designer'
import { LEAD_DEVELOPER_PROMPT } from './lead-developer'
import { DB_ADMIN_PROMPT } from './db-admin'
import { QA_ENGINEER_PROMPT } from './qa-engineer'
import { DEVOPS_ENGINEER_PROMPT } from './devops-engineer'
import { OPERATOR_PROMPT } from './operator'

const AGENT_PROMPTS: Record<AgentType, string> = {
  cto_virtual: CTO_VIRTUAL_PROMPT,
  product_architect: PRODUCT_ARCHITECT_PROMPT,
  system_architect: SYSTEM_ARCHITECT_PROMPT,
  ui_ux_designer: UI_UX_DESIGNER_PROMPT,
  lead_developer: LEAD_DEVELOPER_PROMPT,
  db_admin: DB_ADMIN_PROMPT,
  qa_engineer: QA_ENGINEER_PROMPT,
  devops_engineer: DEVOPS_ENGINEER_PROMPT,
  operator: OPERATOR_PROMPT,
}

export type FullProjectContext = {
  name: string
  description: string | null
  industry: string | null
  persona: string | null
  currentPhase: number
  phaseName: string
  discoveryDocs: string
  featureSpecs: string
  artifacts: string
  attachmentsSummary?: string
}

export function buildAgentPrompt(
  agentType: AgentType,
  context: FullProjectContext,
): string {
  const basePrompt = AGENT_PROMPTS[agentType]

  let prompt = `${basePrompt}

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada'}
- Industria: ${context.industry || 'No especificada'}
- Fase actual: Phase ${String(context.currentPhase).padStart(2, '0')} — ${context.phaseName}
- Perfil del usuario: ${context.persona || 'No especificado'}

DOCUMENTOS DEL PROYECTO:

### Discovery
${context.discoveryDocs || 'No hay documentos de discovery aprobados.'}

### Specs de Features
${context.featureSpecs || 'No hay specs de features aprobados.'}

### Artifacts
${context.artifacts || 'No hay artifacts guardados.'}`

  if (context.attachmentsSummary) {
    prompt += `\n\n### Adjuntos recientes del hilo\n${context.attachmentsSummary}\n`
  }

  return prompt
}

export function buildSuggestionsPrompt(context: FullProjectContext): string {
  return `ROL: Eres el asistente de AI Squad Command Center. Analiza el estado del proyecto y genera 1-3 sugerencias proactivas.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Fase actual: Phase ${String(context.currentPhase).padStart(2, '0')} — ${context.phaseName}
- Industria: ${context.industry || 'No especificada'}

DISCOVERY: ${context.discoveryDocs ? 'Aprobado' : 'No completado'}
SPECS: ${context.featureSpecs ? 'Existen specs aprobados' : 'Sin specs aprobados'}
ARTIFACTS: ${context.artifacts ? 'Existen artifacts' : 'Sin artifacts'}

INSTRUCCIONES:
- Genera 1-3 sugerencias accionables basadas en el estado actual del proyecto
- Cada sugerencia debe ser una pregunta o accion concreta que el usuario pueda enviar como mensaje
- Sugiere el agente mas apropiado para cada sugerencia
- Responde SOLO en formato JSON valido

FORMATO DE RESPUESTA (JSON):
{
  "suggestions": [
    { "id": "s1", "text": "Pregunta o accion sugerida en espanol", "agent_hint": "agent_type_id" }
  ]
}`
}

