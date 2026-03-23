import { generateText, streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import {
  getApprovedDiscoveryDocs,
  getApprovedFeatureSpecs,
  truncateText,
} from '@/lib/ai/context-builder'
import { buildKiroPrompt } from '@/lib/ai/prompts/phase-01'
import { formatChatErrorResponse } from '@/lib/ai/chat-errors'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { KiroDocumentType } from '@/types/feature'
import { buildAgentPrompt } from '@/lib/ai/agents/prompt-builder'
import type { AgentType } from '@/types/agent'

export const maxDuration = 120

type CoreMessage = {
  role: 'user' | 'assistant'
  content: string
}

type StoredMessage = {
  role: string
  content: string
  created_at: string
}

function extractTextFromMessage(message: any): string {
  if (!message) return ''

  if (typeof message.content === 'string') {
    return message.content
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('')
  }

  if (Array.isArray(message.content)) {
    return message.content
      .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('')
  }

  if (typeof message.text === 'string') {
    return message.text
  }

  return ''
}

function toCoreMessages(rawMessages: unknown): CoreMessage[] {
  if (!Array.isArray(rawMessages)) return []

  return rawMessages.map((m: any) => ({
    role: (m?.role ?? 'user') as CoreMessage['role'],
    content: extractTextFromMessage(m),
  }))
}

function toStoredMessages(rawMessages: unknown): StoredMessage[] {
  if (!Array.isArray(rawMessages)) return []

  const now = new Date().toISOString()

  return rawMessages.map((m: any) => ({
    role: m?.role ?? 'user',
    content: extractTextFromMessage(m),
    created_at: m?.created_at ?? now,
  }))
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; featureId: string }> }
) {
  try {
    const { id: projectId, featureId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    const userId = user.id

    const body = await request.json()
    const docType = (body.docType ?? body.document_type) as KiroDocumentType
    const coreMessages = toCoreMessages(body.messages)
    const storedBaseMessages = toStoredMessages(body.messages)

    const isFirstTurn = coreMessages.filter((m) => m.content.trim().length > 0).length <= 1

    // --- Parallelize ALL DB queries upfront ---
    const [
      featureResult,
      projectResult,
      profileResult,
      discoveryDocs,
      previousSpecs,
      existingDocResult,
    ] = await Promise.all([
      supabase
        .from('project_features')
        .select('name, description')
        .eq('id', featureId)
        .single(),
      supabase
        .from('projects')
        .select('name, description, industry, current_phase, user_id')
        .eq('id', projectId)
        .single(),
      supabase
        .from('user_profiles')
        .select('persona')
        .eq('id', user.id)
        .single(),
      getApprovedDiscoveryDocs(projectId),
      getApprovedFeatureSpecs(projectId, featureId),
      supabase
        .from('feature_documents')
        .select('content')
        .eq('feature_id', featureId)
        .eq('document_type', docType)
        .single(),
    ])

    const feature = featureResult.data
    const project = projectResult.data

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 })
    }

    // Update feature status (fire and forget)
    supabase
      .from('project_features')
      .update({ status: 'in_progress' })
      .eq('id', featureId)
      .eq('status', 'pending')
      .then(() => {})

    let systemPrompt = buildKiroPrompt(docType, {
      projectName: project.name,
      description: project.description,
      industry: project.industry,
      persona: profileResult.data?.persona ?? null,
      discoveryDocs: truncateText(discoveryDocs, 8000),
      previousSpecs: truncateText(previousSpecs, 12000),
      featureName: feature?.name ?? '',
      featureDescription: feature?.description ?? null,
    })

    // If a document already exists, inject for refinement context
    if (existingDocResult.data?.content) {
      systemPrompt += `\n\n---\nDOCUMENTO ACTUAL (ya generado — el usuario puede estar pidiendo ajustes):\n${existingDocResult.data.content.slice(0, 6000)}\n---\nSi el usuario pide cambios, responde SOLO con los cambios especificos. Cierra con: "Cambie X e Y. Apruebas o ajustamos algo mas?"\nSi el usuario aprueba los cambios, responde con [SECTION_READY] para que pueda regenerar el documento.`
    }

    // CTO orchestration: consult specialists on first turn
    if (isFirstTurn) {
      const agentContext = {
        name: project.name,
        description: project.description,
        industry: project.industry,
        persona: profileResult.data?.persona ?? null,
        currentPhase: project.current_phase,
        phaseName: 'Requirements & Spec',
        discoveryDocs: truncateText(discoveryDocs, 6000),
        featureSpecs: truncateText(previousSpecs, 8000),
        artifacts: '',
      }

      async function consult(agentType: AgentType, instruction: string) {
        const specialistSystem = buildAgentPrompt(agentType, agentContext)
        const { text, usage } = await generateText({
          model: defaultModel,
          system: specialistSystem,
          messages: [
            {
              role: 'user' as const,
              content: `Feature: ${feature?.name ?? featureId}\nDescripcion: ${feature?.description ?? '—'}\n\n${instruction}\n\nResponde con bullets concretos. Max 600 tokens.`,
            },
          ],
          maxOutputTokens: 600,
          temperature: 0.3,
        })

        const inputTokens =
          usage?.inputTokens ??
          estimateTokensFromText(specialistSystem + instruction)
        const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
        recordAiUsage(supabase, {
          userId,
          projectId,
          eventType: 'phase01_chat',
          model: defaultModel?.toString?.() ?? undefined,
          inputTokens,
          outputTokens,
        }).catch(() => {})

        return text
      }

      const internalNotesParts: string[] = []
      if (docType === 'requirements') {
        const pa = await consult(
          'product_architect',
          'Propone user stories (3-8) y acceptance criteria (2-5 por story) para este feature. Incluye edge cases y out of scope.',
        )
        if (pa) internalNotesParts.push(`## Product Architect\n${pa}`)
      } else if (docType === 'design') {
        const [sa, dba] = await Promise.all([
          consult(
            'system_architect',
            'Propone un diseno tecnico implementable: arquitectura, endpoints /api, flujo UI y decisiones (trade-offs).',
          ),
          consult(
            'db_admin',
            'Propone el modelo de datos (tablas/campos/tipos/indices) y consideraciones de RLS para este feature.',
          ),
        ])
        if (sa) internalNotesParts.push(`## System Architect\n${sa}`)
        if (dba) internalNotesParts.push(`## DB Admin\n${dba}`)
      } else if (docType === 'tasks') {
        const [ld, qa] = await Promise.all([
          consult(
            'lead_developer',
            'Descompone la implementacion en tasks atomicas (1-4h) ordenadas por dependencias (setup/db/backend/frontend).',
          ),
          consult(
            'qa_engineer',
            'Propone tasks de testing (unit/integration/e2e) y casos de prueba criticos para este feature.',
          ),
        ])
        if (ld) internalNotesParts.push(`## Lead Developer\n${ld}`)
        if (qa) internalNotesParts.push(`## QA Engineer\n${qa}`)
      }

      if (internalNotesParts.length > 0) {
        systemPrompt += `\n\n---\n\nCONSULTA INTERNA (SOLO CTO, NO MOSTRAR TAL CUAL):\n${internalNotesParts.join('\n\n')}\n\nINSTRUCCION CTO:\n- Integra estas notas en tu respuesta.\n- Puedes decir "Consulté internamente a X" pero NO pegues estas notas literalmente.\n- Mantén el estilo CTO: decision + justificacion + siguiente paso.\n`
      }
    }

    const section = `feature_${featureId}_${docType}`

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: coreMessages,
      ...AI_CONFIG.chat,
      onFinish: async ({ text, usage }) => {
        const allMessages = [
          ...storedBaseMessages,
          {
            role: 'assistant',
            content: text,
            created_at: new Date().toISOString(),
          },
        ]
        await supabase
          .from('agent_conversations')
          .upsert(
            {
              project_id: projectId,
              phase_number: 1,
              section,
              agent_type: 'orchestrator',
              messages: allMessages,
            },
            { onConflict: 'project_id,phase_number,section,agent_type' }
          )

        // Record AI usage (fire and forget)
        const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt + coreMessages.map(m => m.content).join(''))
        const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
        recordAiUsage(supabase, {
          userId: user.id,
          projectId,
          eventType: 'phase01_chat',
          model: defaultModel?.toString?.() ?? undefined,
          inputTokens,
          outputTokens,
        }).catch(() => {})
      },
    })

    return result.toTextStreamResponse()
  } catch (error: unknown) {
    console.error('[Phase-01 feature chat] Error', error)
    const { status, body } = formatChatErrorResponse(error)
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
