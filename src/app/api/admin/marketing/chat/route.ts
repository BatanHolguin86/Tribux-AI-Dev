import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { anthropic } from '@ai-sdk/anthropic'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'
import { createClient } from '@/lib/supabase/server'
import { AI_CONFIG } from '@/lib/ai/anthropic'
import { ADVANCED_AGENT_MODEL_ID } from '@/lib/ai/agent-models'
import { buildMarketingPrompt } from '@/lib/ai/prompts/marketing-strategist'
import type { MarketingMode } from '@/lib/ai/prompts/marketing-strategist'
import { formatChatErrorResponse } from '@/lib/ai/chat-errors'
import { validateAgentOutput } from '@/lib/ai/output-validator'
import { recordStreamUsage, estimateTokensFromText } from '@/lib/ai/usage'

export const maxDuration = 60

const VALID_MODES = new Set<MarketingMode>(['brand', 'gtm', 'content', 'growth', 'sales', 'competitive'])

export async function POST(request: Request) {
  try {
    const auth = await requireFinancialAdmin()
    if (!auth.allowed) {
      return NextResponse.json(auth.body, { status: auth.status })
    }

    const body = await request.json()
    const { threadId, message, mode = 'brand' } = body as {
      threadId: string
      message: string
      mode?: string
    }

    if (!threadId || !message?.trim()) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Se requiere threadId y message.' },
        { status: 400 },
      )
    }

    const activeMode: MarketingMode = VALID_MODES.has(mode as MarketingMode)
      ? (mode as MarketingMode)
      : 'brand'

    const supabase = await createClient()

    // Fetch existing messages for this thread
    const { data: existingMessages, error: msgError } = await supabase
      .from('marketing_chat_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('[Marketing chat] Messages fetch error', msgError)
      return NextResponse.json(
        { error: 'db_error', message: 'No se pudo cargar la conversación.' },
        { status: 500 },
      )
    }

    // Save the user message
    const { error: insertError } = await supabase
      .from('marketing_chat_messages')
      .insert({ thread_id: threadId, role: 'user', content: message.trim() })

    if (insertError) {
      console.error('[Marketing chat] Insert error', insertError)
      return NextResponse.json(
        { error: 'db_error', message: 'No se pudo guardar el mensaje.' },
        { status: 500 },
      )
    }

    // Update thread mode and timestamp
    await supabase
      .from('marketing_chat_threads')
      .update({ mode: activeMode, updated_at: new Date().toISOString() })
      .eq('id', threadId)

    // Build messages array for the LLM
    const allMessages = [
      ...(existingMessages ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message.trim() },
    ]

    const systemPrompt = buildMarketingPrompt(activeMode)
    const model = anthropic(ADVANCED_AGENT_MODEL_ID)

    const result = streamText({
      model,
      system: systemPrompt,
      messages: allMessages,
      maxOutputTokens: AI_CONFIG.chat.maxOutputTokens,
      temperature: AI_CONFIG.chat.temperature,
      onFinish: async (response) => {
        const validatedText = validateAgentOutput(response.text)

        // Save assistant message
        await supabase
          .from('marketing_chat_messages')
          .insert({
            thread_id: threadId,
            role: 'assistant',
            content: validatedText,
          })

        // Update thread timestamp
        await supabase
          .from('marketing_chat_threads')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', threadId)

        // Record usage
        const inputTokens =
          response.usage?.inputTokens ?? estimateTokensFromText(systemPrompt + allMessages.map((m) => m.content).join(''))
        const outputTokens =
          response.usage?.outputTokens ?? estimateTokensFromText(response.text ?? '')
        await recordStreamUsage({
          userId: auth.userId,
          projectId: null,
          eventType: 'agent_chat',
          model: ADVANCED_AGENT_MODEL_ID,
          usage: { inputTokens, outputTokens },
        })
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error: unknown) {
    console.error('[Marketing chat] Error', error)
    const { status, body } = formatChatErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
