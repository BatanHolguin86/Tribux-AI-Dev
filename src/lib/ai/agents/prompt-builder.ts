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
import { truncateText } from '@/lib/ai/context-builder'
import { getAgentPhaseSpecializationBlock } from './agent-phase-specialization'

/**
 * Agent-specific context budgets (chars).
 * Each agent type gets a custom allocation so truncation preserves
 * the most relevant content for its specialty.
 * Order: [discovery, featureSpecs, artifacts, knowledge]
 */
const AGENT_CONTEXT_BUDGETS: Record<AgentType, [number, number, number, number]> = {
  // CTO: balanced view of everything
  cto_virtual:        [50_000, 80_000, 30_000, 20_000],
  // Product: heavy on discovery + specs (user stories, acceptance criteria)
  product_architect:  [80_000, 60_000, 15_000, 25_000],
  // System: heavy on specs (design docs) + artifacts (ADRs)
  system_architect:   [30_000, 90_000, 40_000, 20_000],
  // UI/UX: heavy on discovery (personas, value prop) + artifacts (designs)
  ui_ux_designer:     [80_000, 40_000, 40_000, 20_000],
  // Lead Dev: heavy on specs (tasks, design) + artifacts (code patterns)
  lead_developer:     [20_000, 100_000, 30_000, 20_000],
  // DB Admin: heavy on specs (design = schemas) + artifacts
  db_admin:           [15_000, 100_000, 40_000, 15_000],
  // QA: heavy on specs (requirements, acceptance criteria) + artifacts
  qa_engineer:        [25_000, 90_000, 30_000, 25_000],
  // DevOps: moderate specs + heavy artifacts (infra configs)
  devops_engineer:    [20_000, 50_000, 60_000, 20_000],
  // Operator: moderate everything, heavy on artifacts (runbooks)
  operator:           [20_000, 50_000, 60_000, 20_000],
}

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
  repoContext?: string
  knowledgeContext?: string
  attachmentsSummary?: string
  wasTruncated?: boolean
}

export function buildAgentPrompt(
  agentType: AgentType,
  context: FullProjectContext,
): string {
  const basePrompt = AGENT_PROMPTS[agentType]

  // Apply agent-specific context budgets for smart truncation
  const [maxDiscovery, maxSpecs, maxArtifacts, maxKB] = AGENT_CONTEXT_BUDGETS[agentType]
  const discovery = context.discoveryDocs ? truncateText(context.discoveryDocs, maxDiscovery) : ''
  const specs = context.featureSpecs ? truncateText(context.featureSpecs, maxSpecs) : ''
  const artifacts = context.artifacts ? truncateText(context.artifacts, maxArtifacts) : ''
  const kb = context.knowledgeContext ? truncateText(context.knowledgeContext, maxKB) : ''

  let prompt = `${basePrompt}

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada'}
- Industria: ${context.industry || 'No especificada'}
- Fase actual: Phase ${String(context.currentPhase).padStart(2, '0')} — ${context.phaseName}
- Perfil del usuario: ${context.persona || 'No especificado'}

DOCUMENTOS DEL PROYECTO:

### Discovery
${discovery || 'No hay documentos de discovery aprobados.'}

### Specs de Features
${specs || 'No hay specs de features aprobados.'}

### Artifacts
${artifacts || 'No hay artifacts guardados.'}

### Decisiones y Notas del Proyecto (Base de Conocimiento)
${kb || 'No hay entradas en la base de conocimiento.'}

### Repositorio GitHub
${context.repoContext || 'No hay repositorio conectado.'}`

  if (context.attachmentsSummary) {
    prompt += `\n\n### Adjuntos recientes del hilo\n${context.attachmentsSummary}\n`
  }

  // Warn agent when context was truncated
  if (context.wasTruncated) {
    prompt += `\n\nNOTA: El contexto del proyecto fue recortado por tamano. Algunos specs o artifacts antiguos pueden no estar completos. Si necesitas informacion especifica que no aparece, pidele al usuario que la comparta.`
  }

  const phaseSpec = getAgentPhaseSpecializationBlock(agentType, context.currentPhase)
  if (phaseSpec) {
    prompt += `\n\n${phaseSpec}`
  }

  // Structured action suggestions
  prompt += `\n\nACCIONES SUGERIDAS (OPCIONAL):
Cuando identifiques un paso accionable concreto, puedes sugerir UNA accion estructurada al final de tu respuesta usando este formato exacto:
---ACTION---
{"type":"navigate","label":"Texto del boton","url":"/projects/PROJECT_ID/phase/XX"}
---/ACTION---

Tipos de accion disponibles:
- "navigate": Lleva al usuario a una seccion relevante. URL debe ser relativa (/projects/...).
- "consult_agent": Sugiere consultar otro agente. Usa {"type":"consult_agent","label":"Consultar al DB Admin","agent":"db_admin"}.

Reglas:
- Maximo UNA accion por respuesta.
- Solo sugiere acciones cuando sean realmente utiles, no en cada mensaje.
- El label debe ser corto y claro en espanol.`

  // Gate instruction for ALL agents: don't pressure phase progression
  prompt += `\n\nREGLA DE FASES (OBLIGATORIA):
- Trabaja SOLO dentro de la fase actual (Phase ${String(context.currentPhase).padStart(2, '0')}).
- NUNCA sugieras "pasar a Phase XX" ni listes un roadmap de fases futuras.
- El usuario controla la progresion mediante botones de aprobacion en la plataforma.
- Si el usuario pregunta sobre una fase futura, responde brevemente pero NO presiones avanzar.`

  return prompt
}

export function buildSuggestionsPrompt(context: FullProjectContext, agentType?: string): string {
  const agentLine = agentType
    ? `\nAGENTE ACTIVO: ${agentType} — prioriza sugerencias relevantes para este tipo de agente.`
    : ''
  return `ROL: Eres el asistente de AI Squad Command Center. Analiza el estado del proyecto y genera 1-3 sugerencias proactivas.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Fase actual: Phase ${String(context.currentPhase).padStart(2, '0')} — ${context.phaseName}
- Industria: ${context.industry || 'No especificada'}${agentLine}

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

