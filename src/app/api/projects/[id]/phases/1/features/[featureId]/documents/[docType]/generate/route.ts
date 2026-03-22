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

function toCoreMessages(raw: unknown, maxMessages = 10): CoreMessage[] {
  if (!Array.isArray(raw)) return []
  // Keep only the last N messages to avoid oversized context
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
  const otherFeatureSpecs = await getApprovedFeatureSpecs(projectId, featureId)

  // Include THIS feature's earlier approved docs (e.g., Requirements when generating Design)
  const { data: ownDocs } = await supabase
    .from('feature_documents')
    .select('document_type, content')
    .eq('feature_id', featureId)
    .eq('status', 'approved')
    .neq('document_type', docTypeKey)

  const ownDocsContext = (ownDocs ?? [])
    .map((d) => `### ${d.document_type} (aprobado)\n${(d.content ?? '').slice(0, 4000)}`)
    .join('\n\n')

  const previousSpecs = [ownDocsContext, otherFeatureSpecs].filter(Boolean).join('\n\n')

  const systemPrompt = buildKiroDocGenerationPrompt(docTypeKey, {
    projectName: context.name,
    description: context.description,
    industry: context.industry,
    persona: context.persona,
    discoveryDocs: discoveryDocs.slice(0, 8000),
    previousSpecs: previousSpecs.slice(0, 12000),
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
