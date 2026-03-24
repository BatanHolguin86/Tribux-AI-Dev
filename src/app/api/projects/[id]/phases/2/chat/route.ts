import { generateText, streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext, buildPhase02Context } from '@/lib/ai/context-builder'
import { buildPhase02Prompt } from '@/lib/ai/prompts/phase-02'
import { formatChatErrorResponse } from '@/lib/ai/chat-errors'
import { canAccessPhase } from '@/lib/plans/guards'
import { checkRateLimit, getClientIp, AGENT_CHAT_RATE_LIMIT } from '@/lib/rate-limit'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { Phase02Section } from '@/types/conversation'
import { buildAgentPrompt } from '@/lib/ai/agents/prompt-builder'
import type { AgentType } from '@/types/agent'
import { extractTextFromMessage } from '@/lib/ai/extract-text-from-message'

export const maxDuration = 60

type CoreMessage = {
  role: 'user' | 'assistant'
  content: string
}

type StoredMessage = {
  role: string
  content: string
  created_at: string
}

function coreRoleFromMessage(m: unknown): CoreMessage['role'] {
  if (m && typeof m === 'object' && 'role' in m) {
    const r = (m as { role?: unknown }).role
    if (r === 'assistant' || r === 'user') return r
  }
  return 'user'
}

function toCoreMessages(rawMessages: unknown): CoreMessage[] {
  if (!Array.isArray(rawMessages)) return []

  return rawMessages.map((m: unknown) => ({
    role: coreRoleFromMessage(m),
    content: extractTextFromMessage(m),
  }))
}

function toStoredMessages(rawMessages: unknown): StoredMessage[] {
  if (!Array.isArray(rawMessages)) return []

  const now = new Date().toISOString()

  return rawMessages.map((m: unknown) => {
    const row = m && typeof m === 'object' ? (m as Record<string, unknown>) : {}
    const role = typeof row.role === 'string' ? row.role : 'user'
    const created_at = typeof row.created_at === 'string' ? row.created_at : now
    return {
      role,
      content: extractTextFromMessage(m),
      created_at,
    }
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }
    const userId = user.id

    // Plan guard: Phase 02 requires trial or paid plan
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (!profile || !canAccessPhase(2, profile)) {
      return new Response(
        JSON.stringify({ error: 'plan_required', message: 'Tu plan no incluye acceso a Phase 02. Upgrade para continuar.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Rate limit
    const ip = getClientIp(request)
    const rateLimitKey = `phase-chat:${user.id}:${ip}`
    const rateResult = checkRateLimit(rateLimitKey, AGENT_CHAT_RATE_LIMIT)
    if (!rateResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'rate_limited', message: 'Has alcanzado el limite de mensajes por hora. Intenta mas tarde.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { section, messages } = await request.json()
    const sectionKey = section as Phase02Section

    console.log('[Phase-02 chat] Incoming request', {
      projectId,
      section: sectionKey,
    })

    // Build project context with discovery docs and feature specs
    const context = await buildPhase02Context(projectId)
    let systemPrompt = buildPhase02Prompt(sectionKey, context)

    // Update section status to in_progress if still pending
    await supabase
      .from('phase_sections')
      .update({ status: 'in_progress' })
      .eq('project_id', projectId)
      .eq('phase_number', 2)
      .eq('section', section)
      .eq('status', 'pending')

    const coreMessages = toCoreMessages(messages)
    const storedBaseMessages = toStoredMessages(messages)

    // CTO orchestration (Option B): consult specialists internally on first turn per section
    const isFirstTurn = coreMessages.filter((m) => m.content.trim().length > 0).length <= 1
    if (isFirstTurn) {
      const full = await buildFullProjectContext(projectId)

      async function consult(agentType: AgentType, instruction: string) {
        const specialistSystem = buildAgentPrompt(agentType, full)
        const { text, usage } = await generateText({
          model: defaultModel,
          system: specialistSystem,
          messages: [
            {
              role: 'user' as const,
              content: `Fase: Phase 02 — Architecture & Design\nSeccion: ${sectionKey}\n\nTarea:\n${instruction}\n\nIMPORTANTE:\n- Responde con bullets concretos y accionables.\n- No hagas preguntas generales; asume que el CTO integrara tu respuesta.\n`,
            },
          ],
          maxOutputTokens: 900,
          temperature: 0.3,
        })

        const inputTokens =
          usage?.inputTokens ??
          estimateTokensFromText(specialistSystem + instruction + sectionKey)
        const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
        recordAiUsage(supabase, {
          userId,
          projectId,
          eventType: 'phase02_chat',
          model: defaultModel?.toString?.() ?? undefined,
          inputTokens,
          outputTokens,
        }).catch(() => {})

        return text
      }

      const internalNotesParts: string[] = []
      if (sectionKey === 'system_architecture') {
        const [sa, ux] = await Promise.all([
          consult(
            'system_architect',
            'Propone arquitectura de alto nivel: componentes, flujos, integraciones externas, modelo de seguridad y consideraciones de escalabilidad.',
          ),
          consult(
            'ui_ux_designer',
            'Propone flujo UI/UX de alto nivel y pantallas principales que se desprenden del discovery y specs (sin wireframes detallados).',
          ),
        ])
        internalNotesParts.push(`## System Architect\n${sa}`, `## UI/UX Designer\n${ux}`)
      } else if (sectionKey === 'database_design') {
        const dba = await consult(
          'db_admin',
          'Propone el modelo de datos: tablas, campos, relaciones, indices y RLS. Incluye estrategia DB vs Storage.',
        )
        internalNotesParts.push(`## DB Admin\n${dba}`)
      } else if (sectionKey === 'api_design') {
        const [sa, ld] = await Promise.all([
          consult(
            'system_architect',
            'Propone la API a nivel de recursos/endpoints y contratos (request/response), auth y rate limiting.',
          ),
          consult(
            'lead_developer',
            'Sugiere patrones de implementacion en Next.js App Router (handlers, Zod, errores consistentes) y consideraciones practicas.',
          ),
        ])
        internalNotesParts.push(`## System Architect\n${sa}`, `## Lead Developer\n${ld}`)
      } else if (sectionKey === 'architecture_decisions') {
        const sa = await consult(
          'system_architect',
          'Identifica 3-6 ADRs clave a documentar (stack, auth, arquitectura, datos, deploy) con alternativas y consecuencias.',
        )
        internalNotesParts.push(`## System Architect\n${sa}`)
      }

      if (internalNotesParts.length > 0) {
        systemPrompt += `\n\n---\n\nCONSULTA INTERNA (SOLO CTO, NO MOSTRAR TAL CUAL):\n${internalNotesParts.join('\n\n')}\n\nINSTRUCCION CTO:\n- Integra estas notas en tu respuesta.\n- Puedes decir \"Consulté internamente a X\" pero NO pegues estas notas literalmente.\n- Mantén el estilo CTO: decision + justificacion + siguiente paso.\n`
      }
    }

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: coreMessages,
      ...AI_CONFIG.chat,
      onFinish: async ({ text, usage }) => {
        try {
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
                phase_number: 2,
                section,
                agent_type: 'orchestrator',
                messages: allMessages,
              },
              { onConflict: 'project_id,phase_number,section,agent_type' }
            )

          // Record AI usage for financial backoffice
          const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt + coreMessages.map(m => m.content).join(''))
          const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
          recordAiUsage(supabase, {
            userId,
            projectId,
            eventType: 'phase02_chat',
            model: defaultModel?.toString?.() ?? undefined,
            inputTokens,
            outputTokens,
          }).catch(() => {})
        } catch (error) {
          console.error('[Phase-02 chat] Error persisting conversation', error)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error: unknown) {
    console.error('[Phase-02 chat] Error', error)
    const { status, body } = formatChatErrorResponse(error)
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
