import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext } from '@/lib/ai/context-builder'
import { buildAgentPrompt } from '@/lib/ai/agents/prompt-builder'
import { generateThreadTitle } from '@/lib/ai/title-generator'
import { formatChatErrorResponse } from '@/lib/ai/chat-errors'
import { uploadChatAttachment } from '@/lib/storage/chat-attachments'
import type { AgentType } from '@/types/agent'

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

async function parseJsonBody(request: Request): Promise<{ messages?: unknown[] } | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function parseFormDataBody(
  request: Request,
): Promise<{ messages?: unknown[]; files: File[] } | null> {
  try {
    const formData = await request.formData()
    const messagesRaw = formData.get('messages')
    const files: File[] = []

    for (const value of formData.getAll('attachments')) {
      if (value instanceof File) {
        files.push(value)
      }
    }

    if (!messagesRaw || typeof messagesRaw !== 'string') {
      return { messages: [], files }
    }

    const parsed = JSON.parse(messagesRaw)
    return {
      messages: Array.isArray(parsed) ? parsed : [],
      files,
    }
  } catch {
    return null
  }
}

function buildAttachmentsSummary(attachments: Array<Record<string, unknown>>): string | undefined {
  if (!attachments.length) return undefined

  const lines = attachments
    .slice(-5)
    .map((att, idx) => {
      const filename = (att.filename as string | undefined) ?? `archivo-${idx + 1}`
      const mime = (att.mimeType as string | undefined) ?? 'tipo-desconocido'
      const size = att.size as number | undefined
      const sizeLabel =
        typeof size === 'number' ? `${(size / 1024).toFixed(1)} KB` : 'tamano-desconocido'
      return `- ${filename} (${mime}, ${sizeLabel})`
    })

  return lines.join('\n')
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; agentType: string; threadId: string }> },
) {
  try {
    const { id: projectId, agentType, threadId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Get thread messages and attachments
    const { data: thread, error: threadError } = await supabase
      .from('conversation_threads')
      .select('messages, message_count, attachments')
      .eq('id', threadId)
      .single()

    if (threadError) {
      console.error('[Agents chat] Thread fetch error', threadError)
      return NextResponse.json(
        {
          error: 'thread_error',
          message:
            threadError.code === 'PGRST116'
              ? 'Hilo no encontrado. Crea una nueva conversación e inténtalo de nuevo.'
              : 'No se pudo cargar la conversación. Intenta de nuevo.',
        },
        { status: threadError.code === 'PGRST116' ? 404 : 500 },
      )
    }

    if (!thread) {
      return NextResponse.json(
        {
          error: 'thread_not_found',
          message: 'Hilo no encontrado. Crea una nueva conversación e inténtalo de nuevo.',
        },
        { status: 404 },
      )
    }

    // Parse incoming message from AI SDK useChat transport
    const contentType = request.headers.get('content-type') ?? ''
    let incomingMessages: unknown[] = []
    let incomingFiles: File[] = []

    if (contentType.includes('multipart/form-data')) {
      const body = await parseFormDataBody(request)
      if (!body) {
        return NextResponse.json(
          { error: 'Invalid request body', message: 'Cuerpo de la petición inválido.' },
          { status: 400 },
        )
      }
      incomingMessages = Array.isArray(body.messages) ? body.messages : []
      incomingFiles = body.files ?? []
    } else {
      const body = await parseJsonBody(request)
      if (!body) {
        return NextResponse.json(
          { error: 'Invalid request body', message: 'Cuerpo de la petición inválido.' },
          { status: 400 },
        )
      }
      incomingMessages = Array.isArray(body.messages) ? body.messages : []
    }

    const lastMsg = incomingMessages[incomingMessages.length - 1]
    if (!lastMsg) {
      return NextResponse.json(
        { error: 'No message', message: 'No se envió ningún mensaje.' },
        { status: 400 },
      )
    }

    const userMessage = extractTextFromMessage(lastMsg)
    if (!userMessage.trim()) {
      return NextResponse.json(
        { error: 'Empty message', message: 'El mensaje no puede estar vacío.' },
        { status: 400 },
      )
    }

    // Build context and prompt
    const projectContext = await buildFullProjectContext(projectId)
    const attachmentsSummary = buildAttachmentsSummary(allAttachments)
    const systemPrompt = buildAgentPrompt(agentType as AgentType, {
      ...projectContext,
      attachmentsSummary,
    })

    // Build full message history
    const existingMessages = (thread.messages as Array<{ role: string; content: string }>) ?? []
    const existingAttachments =
      (thread.attachments as Array<Record<string, unknown>>) ?? []
    const allMessages = [
      ...existingMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ]

    const now = new Date().toISOString()

    // Upload any incoming attachments and extend metadata
    const newAttachments =
      incomingFiles.length > 0
        ? await Promise.all(
            incomingFiles.map((file) =>
              uploadChatAttachment(projectId, threadId, file),
            ),
          )
        : []

    const allAttachments = [...existingAttachments, ...newAttachments]

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: allMessages,
      maxOutputTokens: AI_CONFIG.chat.maxTokens,
      temperature: AI_CONFIG.chat.temperature,
      onFinish: async (response) => {
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
            attachments: allAttachments,
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
  } catch (error: unknown) {
    console.error('[Agents chat] Error', error)
    const { status, body } = formatChatErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
