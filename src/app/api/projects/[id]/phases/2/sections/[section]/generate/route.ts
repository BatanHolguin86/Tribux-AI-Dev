import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildPhase02Context } from '@/lib/ai/context-builder'
import { buildDocumentGenerationPrompt } from '@/lib/ai/prompts/phase-02'
import type { Phase02Section } from '@/types/conversation'

export const maxDuration = 60

type CoreMessage = { role: 'user' | 'assistant'; content: string }

function toCoreMessages(raw: unknown, maxMessages = 10): CoreMessage[] {
  if (!Array.isArray(raw)) return []
  const recent = raw.length > maxMessages ? raw.slice(-maxMessages) : raw
  return recent.map((m: unknown) => {
    const row = m && typeof m === 'object' ? (m as Record<string, unknown>) : {}
    const content = row.content
    return {
      role: (row.role === 'assistant' ? 'assistant' : 'user') as CoreMessage['role'],
      content:
        typeof content === 'string'
          ? content
              .replace(/---OPTIONS---[\s\S]*?---\/OPTIONS---/g, '')
              .replace(/\[SECTION_READY\]/g, '')
              .trim()
              .slice(0, 3000)
          : '',
    }
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; section: string }> }
) {
  const { id: projectId, section } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const sectionKey = section as Phase02Section

  const { data: conversation } = await supabase
    .from('agent_conversations')
    .select('messages')
    .eq('project_id', projectId)
    .eq('phase_number', 2)
    .eq('section', section)
    .eq('agent_type', 'orchestrator')
    .single()

  if (!conversation?.messages) {
    return new Response('No conversation found for this section', { status: 400 })
  }

  const context = await buildPhase02Context(projectId)
  const systemPrompt = buildDocumentGenerationPrompt(sectionKey, context)
  const coreMessages = toCoreMessages(conversation.messages)

  try {
    // Stream the generation — saving happens client-side via /save endpoint
    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        ...coreMessages,
        { role: 'user' as const, content: 'Genera el documento completo de arquitectura basado en nuestra conversacion.' },
      ],
      ...AI_CONFIG.documentGeneration,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[Phase02 generate] error', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error generating document' },
      { status: 500 },
    )
  }
}
