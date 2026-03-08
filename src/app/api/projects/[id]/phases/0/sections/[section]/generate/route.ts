import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildProjectContext } from '@/lib/ai/context-builder'
import { buildDocumentGenerationPrompt, SECTION_DOC_NAMES } from '@/lib/ai/prompts/phase-00'
import { uploadDocument } from '@/lib/storage/documents'
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
    onFinish: async ({ text }) => {
      const docName = SECTION_DOC_NAMES[sectionKey]
      const storagePath = `discovery/${docName}`

      // Upload to storage
      await uploadDocument(projectId, storagePath, text)

      // Upsert document record
      await supabase
        .from('project_documents')
        .upsert(
          {
            project_id: projectId,
            phase_number: 0,
            section,
            document_type: section === 'problem_statement' ? 'brief' : section,
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
        .eq('phase_number', 0)
        .eq('section', section)
    },
  })

  return result.toTextStreamResponse()
}
