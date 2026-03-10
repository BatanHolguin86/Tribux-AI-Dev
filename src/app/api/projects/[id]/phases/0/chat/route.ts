import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildProjectContext } from '@/lib/ai/context-builder'
import { buildPhase00Prompt } from '@/lib/ai/prompts/phase-00'
import { formatChatErrorResponse } from '@/lib/ai/chat-errors'
import type { Phase00Section } from '@/types/conversation'

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

    const { section, messages } = await request.json()
    const sectionKey = section as Phase00Section

    // Quick instrumentation to verificar entorno IA
    console.log('[Phase-00 chat] Incoming request', {
      projectId,
      section: sectionKey,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    })

    // Build project context and system prompt
    const context = await buildProjectContext(projectId)
    const systemPrompt = buildPhase00Prompt(sectionKey, context)

    // Update section status to in_progress if still pending
    await supabase
      .from('phase_sections')
      .update({ status: 'in_progress' })
      .eq('project_id', projectId)
      .eq('phase_number', 0)
      .eq('section', section)
      .eq('status', 'pending')

    const coreMessages = toCoreMessages(messages)
    const storedBaseMessages = toStoredMessages(messages)

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: coreMessages,
      ...AI_CONFIG.chat,
      onFinish: async ({ text }) => {
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

