import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildProjectContext } from '@/lib/ai/context-builder'
import { buildDocumentGenerationPrompt, SECTION_DOC_NAMES } from '@/lib/ai/prompts/phase-00'
import { uploadDocument } from '@/lib/storage/documents'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { Phase00Section } from '@/types/conversation'

export const maxDuration = 120

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

  const sectionKey = section as Phase00Section

  const { data: conversation } = await supabase
    .from('agent_conversations')
    .select('messages')
    .eq('project_id', projectId)
    .eq('phase_number', 0)
    .eq('section', section)
    .eq('agent_type', 'orchestrator')
    .single()

  if (!conversation?.messages) {
    return new Response('No conversation found for this section', { status: 400 })
  }

  const context = await buildProjectContext(projectId)
  const systemPrompt = buildDocumentGenerationPrompt(sectionKey, context)
  const coreMessages = toCoreMessages(conversation.messages)

  try {
    const docName = SECTION_DOC_NAMES[sectionKey]
    const storagePath = `discovery/${docName}`
    const docType = section === 'problem_statement' ? 'brief' : section

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        ...coreMessages,
        { role: 'user' as const, content: 'Genera el documento completo basado en nuestra conversacion.' },
      ],
      ...AI_CONFIG.documentGeneration,
      onFinish: async (response) => {
        try {
          const text = response.text

          // Upload to storage (best effort)
          uploadDocument(projectId, storagePath, text).catch((err) => {
            console.error('[Phase00 generate] uploadDocument failed', err)
          })

          // Save document record
          await supabase
            .from('project_documents')
            .delete()
            .eq('project_id', projectId)
            .eq('phase_number', 0)
            .eq('section', section)
            .eq('document_type', docType)

          await supabase
            .from('project_documents')
            .insert({
              project_id: projectId,
              phase_number: 0,
              section,
              document_type: docType,
              storage_path: `projects/${projectId}/${storagePath}`,
              content: text,
              version: 1,
              status: 'draft',
            })

          // Update section to completed
          await supabase
            .from('phase_sections')
            .update({ status: 'completed' })
            .eq('project_id', projectId)
            .eq('phase_number', 0)
            .eq('section', section)

          // Record AI usage
          const inputTokens = response.usage?.inputTokens ?? estimateTokensFromText(systemPrompt)
          const outputTokens = response.usage?.outputTokens ?? estimateTokensFromText(text)
          recordAiUsage(supabase, {
            userId: user.id,
            projectId,
            eventType: 'phase00_generate',
            model: defaultModel?.toString?.() ?? undefined,
            inputTokens,
            outputTokens,
          }).catch(() => {})
        } catch (err) {
          console.error('[Phase00 generate] onFinish error', err)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[Phase00 generate] error', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error generating document' },
      { status: 500 },
    )
  }
}
