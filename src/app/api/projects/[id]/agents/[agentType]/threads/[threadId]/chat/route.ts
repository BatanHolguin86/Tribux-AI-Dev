import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext } from '@/lib/ai/context-builder'
import { buildAgentPrompt } from '@/lib/ai/agents/prompt-builder'
import { generateThreadTitle } from '@/lib/ai/title-generator'
import type { AgentType } from '@/types/agent'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; agentType: string; threadId: string }> },
) {
  const { id: projectId, agentType, threadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Get thread messages
  const { data: thread } = await supabase
    .from('conversation_threads')
    .select('messages, message_count')
    .eq('id', threadId)
    .single()

  if (!thread) return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 })

  // Parse incoming message from AI SDK useChat transport
  const body = await request.json()
  const incomingMessages = body.messages as Array<{ role: string; content: string | Array<{ type: string; text: string }> }>
  const lastMsg = incomingMessages[incomingMessages.length - 1]
  const userMessage = typeof lastMsg.content === 'string'
    ? lastMsg.content
    : lastMsg.content.filter((p) => p.type === 'text').map((p) => p.text).join('')

  // Build context and prompt
  const projectContext = await buildFullProjectContext(projectId)
  const systemPrompt = buildAgentPrompt(agentType as AgentType, projectContext)

  // Build full message history
  const existingMessages = (thread.messages as Array<{ role: string; content: string }>) ?? []
  const allMessages = [
    ...existingMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ]

  const result = streamText({
    model: defaultModel,
    system: systemPrompt,
    messages: allMessages,
    maxOutputTokens: AI_CONFIG.chat.maxTokens,
    temperature: AI_CONFIG.chat.temperature,
    onFinish: async (response) => {
      const now = new Date().toISOString()
      const updatedMessages = [
        ...existingMessages,
        { role: 'user', content: userMessage, created_at: now },
        { role: 'assistant', content: response.text, created_at: now },
      ]

      await supabase
        .from('conversation_threads')
        .update({
          messages: updatedMessages,
          message_count: updatedMessages.length,
          last_message_at: now,
        })
        .eq('id', threadId)

      // Auto-generate title on first message
      if (thread.message_count === 0) {
        const title = await generateThreadTitle(userMessage)
        await supabase
          .from('conversation_threads')
          .update({ title })
          .eq('id', threadId)
      }
    },
  })

  return result.toTextStreamResponse()
}
