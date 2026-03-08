import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildProjectContext } from '@/lib/ai/context-builder'
import { buildPhase00Prompt } from '@/lib/ai/prompts/phase-00'
import type { Phase00Section } from '@/types/conversation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const result = streamText({
    model: defaultModel,
    system: systemPrompt,
    messages,
    ...AI_CONFIG.chat,
    onFinish: async ({ text }) => {
      // Persist the conversation
      const allMessages = [
        ...messages,
        { role: 'assistant', content: text, created_at: new Date().toISOString() },
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
    },
  })

  return result.toTextStreamResponse()
}
