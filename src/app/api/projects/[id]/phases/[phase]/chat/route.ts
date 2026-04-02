import { generateText, streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext, getProjectKnowledgeContext } from '@/lib/ai/context-builder'
import { buildPhaseChatPrompt, PHASE_SPECIALIST_MAP } from '@/lib/ai/prompts/phase-chat-builders'
import { buildAgentPrompt } from '@/lib/ai/agents/prompt-builder'
import { formatChatErrorResponse, wrapStreamWithErrorHandling } from '@/lib/ai/chat-errors'
import { canAccessPhase } from '@/lib/plans/guards'
import { checkRateLimit, getClientIp, AGENT_CHAT_RATE_LIMIT } from '@/lib/rate-limit'
import { recordStreamUsage, estimateTokensFromText } from '@/lib/ai/usage'
import { validateAgentOutput } from '@/lib/ai/output-validator'
import { extractTextFromMessage } from '@/lib/ai/extract-text-from-message'
import type { AgentType } from '@/types/agent'
import type { AiUsageEventType } from '@/lib/ai/usage'

export const maxDuration = 60

const PHASE_EVENT_TYPE: Record<number, AiUsageEventType> = {
  3: 'phase03_chat',
  4: 'phase04_chat',
  5: 'phase05_chat',
  6: 'phase06_chat',
  7: 'phase07_chat',
}

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
    return { role, content: extractTextFromMessage(m), created_at }
  })
}

const VALID_PHASES = [3, 4, 5, 6, 7]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; phase: string }> }
) {
  try {
    const { id: projectId, phase: phaseParam } = await params
    const phaseNumber = parseInt(phaseParam, 10)

    if (!VALID_PHASES.includes(phaseNumber)) {
      return new Response(
        JSON.stringify({ error: 'invalid_phase', message: 'Phase must be between 3 and 7.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }
    const userId = user.id

    // Plan guard
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (!profile || !canAccessPhase(phaseNumber, profile)) {
      return new Response(
        JSON.stringify({ error: 'plan_required', message: 'Tu plan no incluye acceso a esta fase. Upgrade para continuar.' }),
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

    const { messages } = await request.json()

    console.log(`[Phase-${String(phaseNumber).padStart(2, '0')} chat] Incoming request`, { projectId })

    // Build context + KB in parallel
    const [fullContext, knowledgeContext] = await Promise.all([
      buildFullProjectContext(projectId),
      getProjectKnowledgeContext(projectId),
    ])

    const chatContext = {
      ...fullContext,
      currentPhase: phaseNumber,
      phaseName: fullContext.phaseName,
      knowledgeContext,
    }

    let systemPrompt = buildPhaseChatPrompt(phaseNumber, chatContext)

    const coreMessages = toCoreMessages(messages)
    const storedBaseMessages = toStoredMessages(messages)

    // CTO orchestration: consult specialists on first turn
    const isFirstTurn = coreMessages.filter((m) => m.content.trim().length > 0).length <= 1
    if (isFirstTurn) {
      const specialists = PHASE_SPECIALIST_MAP[phaseNumber] ?? []

      async function consult(agentType: AgentType, instruction: string) {
        const specialistSystem = buildAgentPrompt(agentType, chatContext)
        const { text, usage } = await generateText({
          model: defaultModel,
          system: specialistSystem,
          messages: [
            {
              role: 'user' as const,
              content: `Fase: Phase ${String(phaseNumber).padStart(2, '0')} — ${fullContext.phaseName}\n\nTarea:\n${instruction}\n\nIMPORTANTE:\n- Responde con bullets concretos y accionables.\n- No hagas preguntas generales; asume que el CTO integrara tu respuesta.\n`,
            },
          ],
          maxOutputTokens: 900,
          temperature: 0.3,
        })

        const inputTokens =
          usage?.inputTokens ??
          estimateTokensFromText(specialistSystem + instruction)
        const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
        recordStreamUsage({
          userId,
          projectId,
          eventType: PHASE_EVENT_TYPE[phaseNumber],
          model: defaultModel?.toString?.() ?? undefined,
          usage: { inputTokens, outputTokens },
        })

        return { agentType, text }
      }

      const consultResults = await Promise.all(
        specialists.map((s) => consult(s.agent, s.instruction))
      )

      if (consultResults.length > 0) {
        const internalNotes = consultResults
          .map((r) => `## ${r.agentType}\n${r.text}`)
          .join('\n\n')

        systemPrompt += `\n\n---\n\nCONSULTA INTERNA (SOLO CTO, NO MOSTRAR TAL CUAL):\n${internalNotes}\n\nINSTRUCCION CTO:\n- Integra estas notas en tu respuesta.\n- Puedes decir "Consulte internamente a X" pero NO pegues estas notas literalmente.\n- Manten el estilo CTO: decision + justificacion + siguiente paso.\n`
      }
    }

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: coreMessages,
      ...AI_CONFIG.chat,
      onFinish: async ({ text, usage }) => {
        try {
          const validatedText = validateAgentOutput(text)

          const allMessages = [
            ...storedBaseMessages,
            {
              role: 'assistant',
              content: validatedText,
              created_at: new Date().toISOString(),
            },
          ]

          await supabase
            .from('agent_conversations')
            .upsert(
              {
                project_id: projectId,
                phase_number: phaseNumber,
                section: 'all',
                agent_type: 'orchestrator',
                messages: allMessages,
              },
              { onConflict: 'project_id,phase_number,section,agent_type' }
            )

          // Record AI usage (admin client — reliable in serverless, bypasses RLS)
          const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt + coreMessages.map(m => m.content).join(''))
          const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
          await recordStreamUsage({
            userId,
            projectId,
            eventType: PHASE_EVENT_TYPE[phaseNumber],
            model: defaultModel?.toString?.() ?? undefined,
            usage: { inputTokens, outputTokens },
          })
        } catch (error) {
          console.error(`[Phase-${String(phaseNumber).padStart(2, '0')} chat] Error persisting conversation`, error)
        }
      },
    })

    const response = result.toTextStreamResponse()
    return new Response(wrapStreamWithErrorHandling(response.body!), {
      headers: response.headers,
    })
  } catch (error: unknown) {
    console.error('[Phase chat] Error', error)
    const { status, body } = formatChatErrorResponse(error)
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
