import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildProjectContext, getApprovedDiscoveryDocs, getApprovedFeatureSpecs } from '@/lib/ai/context-builder'
import { buildKiroPrompt } from '@/lib/ai/prompts/phase-01'
import type { KiroDocumentType } from '@/types/feature'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; featureId: string }> }
) {
  const { id: projectId, featureId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { document_type, messages } = await request.json()
  const docType = document_type as KiroDocumentType

  const context = await buildProjectContext(projectId)
  const discoveryDocs = await getApprovedDiscoveryDocs(projectId)
  const previousSpecs = await getApprovedFeatureSpecs(projectId, featureId)

  const { data: feature } = await supabase
    .from('project_features')
    .select('name, description')
    .eq('id', featureId)
    .single()

  // Update feature status to in_progress
  await supabase
    .from('project_features')
    .update({ status: 'in_progress' })
    .eq('id', featureId)
    .eq('status', 'pending')

  const systemPrompt = buildKiroPrompt(docType, {
    projectName: context.name,
    description: context.description,
    industry: context.industry,
    persona: context.persona,
    discoveryDocs,
    previousSpecs,
    featureName: feature?.name ?? '',
    featureDescription: feature?.description ?? null,
  })

  const section = `feature_${featureId}_${docType}`

  const result = streamText({
    model: defaultModel,
    system: systemPrompt,
    messages,
    ...AI_CONFIG.chat,
    onFinish: async ({ text }) => {
      const allMessages = [
        ...messages,
        { role: 'assistant', content: text, created_at: new Date().toISOString() },
      ]
      await supabase
        .from('agent_conversations')
        .upsert(
          {
            project_id: projectId,
            phase_number: 1,
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
