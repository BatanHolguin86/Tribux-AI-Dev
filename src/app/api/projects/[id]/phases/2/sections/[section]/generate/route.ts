import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildPhase02Context } from '@/lib/ai/context-builder'
import { buildDocumentGenerationPrompt, SECTION_DOC_NAMES } from '@/lib/ai/prompts/phase-02'
import { uploadDocument } from '@/lib/storage/documents'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { Phase02Section } from '@/types/conversation'

export const maxDuration = 60

type CoreMessage = { role: 'user' | 'assistant'; content: string }

function toCoreMessages(raw: unknown): CoreMessage[] {
  if (!Array.isArray(raw)) return []
  return raw.map((m: any) => ({
    role: (m?.role === 'assistant' ? 'assistant' : 'user') as CoreMessage['role'],
    content: typeof m?.content === 'string'
      ? m.content.replace(/---OPTIONS---[\s\S]*?---\/OPTIONS---/g, '').trim()
      : '',
  }))
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

  // Get conversation history for context
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

  const result = streamText({
    model: defaultModel,
    system: systemPrompt,
    messages: [
      ...coreMessages,
      {
        role: 'user' as const,
        content: 'Genera el documento completo de arquitectura basado en nuestra conversacion.',
      },
    ],
    ...AI_CONFIG.documentGeneration,
    onFinish: async ({ text, usage }) => {
      const docName = SECTION_DOC_NAMES[sectionKey]
      const storagePath = `architecture/${docName}`

      // Upload to storage
      await uploadDocument(projectId, storagePath, text)

      // Upsert document record
      await supabase
        .from('project_documents')
        .upsert(
          {
            project_id: projectId,
            phase_number: 2,
            section,
            document_type: section,
            storage_path: `projects/${projectId}/${storagePath}`,
            content: text,
            version: 1,
            status: 'draft',
          },
          { onConflict: 'project_id,phase_number,section,document_type' }
        )

      // Update section to completed
      await supabase
        .from('phase_sections')
        .update({ status: 'completed' })
        .eq('project_id', projectId)
        .eq('phase_number', 2)
        .eq('section', section)

      // Record AI usage for financial backoffice
      const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt + JSON.stringify(conversation.messages))
      const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
      recordAiUsage(supabase, {
        userId: user.id,
        projectId,
        eventType: 'phase02_generate',
        model: defaultModel?.toString?.() ?? undefined,
        inputTokens,
        outputTokens,
      }).catch(() => {})
    },
  })

  return result.toTextStreamResponse()
}
