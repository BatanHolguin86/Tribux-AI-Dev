import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildProjectContext, getApprovedDiscoveryDocs, getApprovedFeatureSpecs } from '@/lib/ai/context-builder'
import { buildKiroDocGenerationPrompt } from '@/lib/ai/prompts/phase-01'
import { uploadDocument } from '@/lib/storage/documents'
import { slugify } from '@/lib/utils'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { KiroDocumentType } from '@/types/feature'

export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; featureId: string; docType: string }> }
) {
  const { id: projectId, featureId, docType } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const docTypeKey = docType as KiroDocumentType
  const section = `feature_${featureId}_${docTypeKey}`

  const { data: conversation } = await supabase
    .from('agent_conversations')
    .select('messages')
    .eq('project_id', projectId)
    .eq('phase_number', 1)
    .eq('section', section)
    .single()

  if (!conversation?.messages) {
    return new Response('No conversation found', { status: 400 })
  }

  const { data: feature } = await supabase
    .from('project_features')
    .select('name, description')
    .eq('id', featureId)
    .single()

  const context = await buildProjectContext(projectId)
  const discoveryDocs = await getApprovedDiscoveryDocs(projectId)
  const previousSpecs = await getApprovedFeatureSpecs(projectId, featureId)

  const systemPrompt = buildKiroDocGenerationPrompt(docTypeKey, {
    projectName: context.name,
    description: context.description,
    industry: context.industry,
    persona: context.persona,
    discoveryDocs,
    previousSpecs,
    featureName: feature?.name ?? '',
    featureDescription: feature?.description ?? null,
  })

  const featureSlug = slugify(feature?.name ?? featureId)

  const result = streamText({
    model: defaultModel,
    system: systemPrompt,
    messages: [
      ...conversation.messages,
      { role: 'user' as const, content: 'Genera el documento completo basado en nuestra conversacion.' },
    ],
    ...AI_CONFIG.documentGeneration,
    onFinish: async ({ text, usage }) => {
      const storagePath = `specs/${featureSlug}/${docTypeKey}.md`
      await uploadDocument(projectId, storagePath, text)

      await supabase
        .from('feature_documents')
        .upsert(
          {
            feature_id: featureId,
            project_id: projectId,
            document_type: docTypeKey,
            storage_path: `projects/${projectId}/${storagePath}`,
            content: text,
            version: 1,
            status: 'draft',
          },
          { onConflict: 'feature_id,document_type' }
        )

      // Record AI usage for financial backoffice
      const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt + JSON.stringify(conversation.messages))
      const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
      recordAiUsage(supabase, {
        userId: user.id,
        projectId,
        eventType: 'phase01_generate',
        model: defaultModel?.toString?.() ?? undefined,
        inputTokens,
        outputTokens,
      }).catch(() => {})
    },
  })

  return result.toTextStreamResponse()
}
