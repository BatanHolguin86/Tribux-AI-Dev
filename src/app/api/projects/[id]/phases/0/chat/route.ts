import { generateText, streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext, buildProjectContext } from '@/lib/ai/context-builder'
import { buildPhase00Prompt } from '@/lib/ai/prompts/phase-00'
import { formatChatErrorResponse } from '@/lib/ai/chat-errors'
import { checkRateLimit, getClientIp, AGENT_CHAT_RATE_LIMIT } from '@/lib/rate-limit'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { Phase00Section } from '@/types/conversation'
import { buildAgentPrompt } from '@/lib/ai/agents/prompt-builder'
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
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Phase-00 chat] Missing ANTHROPIC_API_KEY')
      return new Response(
        JSON.stringify({
          error: 'missing_anthropic_key',
          message:
            'La IA de Discovery no está configurada (falta ANTHROPIC_API_KEY en el servidor). Pide a quien administra el proyecto que configure la clave de Anthropic.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }
    const userId = user.id

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
    const sectionKey = section as Phase00Section

    // Quick instrumentation to verificar entorno IA
    console.log('[Phase-00 chat] Incoming request', {
      projectId,
      section: sectionKey,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    })

    const coreMessages = toCoreMessages(messages)
    const storedBaseMessages = toStoredMessages(messages)

    // Build project context and system prompt
    const context = await buildProjectContext(projectId)
    let systemPrompt = buildPhase00Prompt(sectionKey, context)

    // CTO orchestration (Option B): consult Product Architect selectively on first turn
    const isFirstTurn = coreMessages.filter((m) => m.content.trim().length > 0).length <= 1
    const shouldConsult =
      isFirstTurn && (sectionKey === 'value_proposition' || sectionKey === 'competitive_analysis')

    if (shouldConsult) {
      const full = await buildFullProjectContext(projectId)
      const specialistSystem = buildAgentPrompt('product_architect', full)

      const { text, usage } = await generateText({
        model: defaultModel,
        system: specialistSystem,
        messages: [
          {
            role: 'user' as const,
            content:
              sectionKey === 'value_proposition'
                ? 'Ayuda al CTO a completar Value Proposition: redacta una propuesta de valor en 1 frase, 3 diferenciadores, momento \"aha\" y 3 features core del MVP. Usa el discovery existente; si falta algo, sugiere supuestos razonables y señalalos.'
                : 'Ayuda al CTO a completar Competitive Analysis: lista 3 competidores (directos/indirectos), fortalezas/debilidades, pricing aproximado si es razonable inferir, matriz de posicionamiento con 2 criterios relevantes, y una ventaja sostenible probable. Usa el discovery existente; evita preguntas basicas.',
          },
        ],
        maxOutputTokens: 900,
        temperature: 0.3,
      })

      const inputTokens =
        usage?.inputTokens ?? estimateTokensFromText(specialistSystem + sectionKey)
      const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
      recordAiUsage(supabase, {
        userId,
        projectId,
        eventType: 'phase00_chat',
        model: defaultModel?.toString?.() ?? undefined,
        inputTokens,
        outputTokens,
      }).catch(() => {})

      systemPrompt += `\n\n---\n\nCONSULTA INTERNA (SOLO CTO, NO MOSTRAR TAL CUAL):\n## Product Architect\n${text}\n\nINSTRUCCION CTO:\n- Integra estas notas en tu respuesta.\n- Puedes decir \"Consulté internamente al Product Architect\" pero NO pegues estas notas literalmente.\n- Mantén el estilo CTO y guía a cerrar esta sección.\n`
    }

    // Update section status to in_progress if still pending
    await supabase
      .from('phase_sections')
      .update({ status: 'in_progress' })
      .eq('project_id', projectId)
      .eq('phase_number', 0)
      .eq('section', section)
      .eq('status', 'pending')

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: coreMessages,
      ...AI_CONFIG.chat,
      onFinish: async ({ text, usage }) => {
        try {
          // Persist the conversation
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
                phase_number: 0,
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
            eventType: 'phase00_chat',
            model: defaultModel?.toString?.() ?? undefined,
            inputTokens,
            outputTokens,
          }).catch(() => {})
        } catch (error) {
          console.error('[Phase-00 chat] Error persisting conversation', error)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error: unknown) {
    console.error('[Phase-00 chat] Error calling Anthropic or building response', error)
    const { status, body } = formatChatErrorResponse(error)
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

