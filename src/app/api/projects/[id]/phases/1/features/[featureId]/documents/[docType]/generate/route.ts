import { generateText } from 'ai'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildProjectContext, getApprovedDiscoveryDocs, getApprovedFeatureSpecs } from '@/lib/ai/context-builder'
import { buildKiroDocGenerationPrompt } from '@/lib/ai/prompts/phase-01'
import { uploadDocument } from '@/lib/storage/documents'
import { slugify } from '@/lib/utils'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { KiroDocumentType } from '@/types/feature'

export const maxDuration = 120

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
  _request: Request,
  { params }: { params: Promise<{ id: string; featureId: string; docType: string }> }
) {
  const { id: projectId, featureId, docType } = await params
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()
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
  const coreMessages = toCoreMessages(conversation.messages)

  try {
    const { text, usage } = await generateText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        ...coreMessages,
        { role: 'user' as const, content: 'Genera el documento completo basado en nuestra conversacion.' },
      ],
      ...AI_CONFIG.documentGeneration,
    })

    const storagePath = `specs/${featureSlug}/${docTypeKey}.md`
    const storageFullPath = `projects/${projectId}/${storagePath}`

    // Upload to storage (best effort)
    try {
      await uploadDocument(projectId, storagePath, text)
    } catch (err) {
      console.error('[Phase01 generate] uploadDocument failed', err)
    }

    // Save to DB (critical)
    const { error: upsertError } = await adminSupabase
      .from('feature_documents')
      .upsert(
        {
          feature_id: featureId,
          project_id: projectId,
          document_type: docTypeKey,
          storage_path: storageFullPath,
          content: text,
          version: 1,
          status: 'draft',
        },
        { onConflict: 'feature_id,document_type' },
      )

    if (upsertError) {
      console.error('[Phase01 generate] feature_documents upsert failed', upsertError)
      return Response.json({ error: 'Failed to save document' }, { status: 500 })
    }

    // Record AI usage (best effort)
    const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt)
    const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
    recordAiUsage(supabase, {
      userId: user.id,
      projectId,
      eventType: 'phase01_generate',
      model: defaultModel?.toString?.() ?? undefined,
      inputTokens,
      outputTokens,
    }).catch(() => {})

    return Response.json({ success: true })
  } catch (error) {
    console.error('[Phase01 generate] error', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error generating document' },
      { status: 500 },
    )
  }
}
