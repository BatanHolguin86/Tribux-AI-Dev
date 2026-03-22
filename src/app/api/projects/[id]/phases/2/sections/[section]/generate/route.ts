import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildPhase02Context } from '@/lib/ai/context-builder'
import { buildDocumentGenerationPrompt, SECTION_DOC_NAMES } from '@/lib/ai/prompts/phase-02'
import { uploadDocument } from '@/lib/storage/documents'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { Phase02Section } from '@/types/conversation'

export const maxDuration = 120

type CoreMessage = { role: 'user' | 'assistant'; content: string }

function toCoreMessages(raw: unknown, maxMessages = 10): CoreMessage[] {
  if (!Array.isArray(raw)) return []
  const recent = raw.length > maxMessages ? raw.slice(-maxMessages) : raw
  return recent.map((m: any) => ({
    role: (m?.role === 'assistant' ? 'assistant' : 'user') as CoreMessage['role'],
    content: typeof m?.content === 'string'
      ? m.content
          .replace(/---OPTIONS---[\s\S]*?---\/OPTIONS---/g, '')
          .replace(/\[SECTION_READY\]/g, '')
          .trim()
          .slice(0, 3000)
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
    const { text, usage } = await generateText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        ...coreMessages,
        { role: 'user' as const, content: 'Genera el documento completo de arquitectura basado en nuestra conversacion.' },
      ],
      ...AI_CONFIG.documentGeneration,
    })

    const docName = SECTION_DOC_NAMES[sectionKey]
    const storagePath = `architecture/${docName}`

    // Upload to storage (best effort)
    try {
      await uploadDocument(projectId, storagePath, text)
    } catch (err) {
      console.error('[Phase02 generate] uploadDocument failed', err)
    }

    // Upsert document record
    const { error: upsertError } = await supabase
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

    if (upsertError) {
      console.error('[Phase02 generate] upsert failed', upsertError)
      return Response.json({ error: 'Failed to save document' }, { status: 500 })
    }

    // Update section to completed
    await supabase
      .from('phase_sections')
      .update({ status: 'completed' })
      .eq('project_id', projectId)
      .eq('phase_number', 2)
      .eq('section', section)

    // Record AI usage (best effort)
    const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt)
    const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
    recordAiUsage(supabase, {
      userId: user.id,
      projectId,
      eventType: 'phase02_generate',
      model: defaultModel?.toString?.() ?? undefined,
      inputTokens,
      outputTokens,
    }).catch(() => {})

    return Response.json({ success: true })
  } catch (error) {
    console.error('[Phase02 generate] error', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error generating document' },
      { status: 500 },
    )
  }
}
