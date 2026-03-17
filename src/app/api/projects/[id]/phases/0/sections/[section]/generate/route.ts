import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildProjectContext } from '@/lib/ai/context-builder'
import { buildDocumentGenerationPrompt, SECTION_DOC_NAMES } from '@/lib/ai/prompts/phase-00'
import { uploadDocument } from '@/lib/storage/documents'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { Phase00Section } from '@/types/conversation'

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

  // Get conversation history for context
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

  const result = streamText({
    model: defaultModel,
    system: systemPrompt,
    messages: [
      ...conversation.messages,
      {
        role: 'user' as const,
        content: 'Genera el documento completo basado en nuestra conversacion.',
      },
    ],
    ...AI_CONFIG.documentGeneration,
    onFinish: async ({ text, usage }) => {
      try {
        const docName = SECTION_DOC_NAMES[sectionKey]
        const storagePath = `discovery/${docName}`

        // Upload to storage
        await uploadDocument(projectId, storagePath, text)

        // Save document record (delete existing + insert to avoid unique constraint issues)
        const docType = section === 'problem_statement' ? 'brief' : section
        await supabase
          .from('project_documents')
          .delete()
          .eq('project_id', projectId)
          .eq('phase_number', 0)
          .eq('section', section)
          .eq('document_type', docType)

        const { error: insertError } = await supabase
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

        if (insertError) {
          console.error('[Generate] Error saving document:', insertError.message)
        }

        // Update section to completed
        const { error: sectionError } = await supabase
          .from('phase_sections')
          .update({ status: 'completed' })
          .eq('project_id', projectId)
          .eq('phase_number', 0)
          .eq('section', section)

        if (sectionError) {
          console.error('[Generate] Error updating section:', sectionError.message)
        }

        // Record AI usage for financial backoffice
        const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt + JSON.stringify(conversation.messages))
        const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
        recordAiUsage(supabase, {
          userId: user.id,
          projectId,
          eventType: 'phase00_generate',
          model: defaultModel?.toString?.() ?? undefined,
          inputTokens,
          outputTokens,
        }).catch(() => {})

        console.log(`[Generate] Document saved for ${section} in project ${projectId}`)
      } catch (err) {
        console.error('[Generate] onFinish error:', err)
      }
    },
  })

  return result.toTextStreamResponse()
}
