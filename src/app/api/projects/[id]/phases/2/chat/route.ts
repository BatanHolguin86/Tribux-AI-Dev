import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildPhase02Context } from '@/lib/ai/context-builder'
import { buildPhase02Prompt } from '@/lib/ai/prompts/phase-02'
import { formatChatErrorResponse } from '@/lib/ai/chat-errors'
import { canAccessPhase } from '@/lib/plans/guards'
import { checkRateLimit, getClientIp, AGENT_CHAT_RATE_LIMIT } from '@/lib/rate-limit'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { Phase02Section } from '@/types/conversation'

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
    const systemPrompt = buildPhase02Prompt(sectionKey, context)

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
            userId: user.id,
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
