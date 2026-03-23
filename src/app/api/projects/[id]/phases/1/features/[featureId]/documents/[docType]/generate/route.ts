import { generateText } from 'ai'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import {
  buildFullProjectContext,
  buildProjectContext,
  getApprovedDiscoveryDocs,
  getApprovedFeatureSpecs,
} from '@/lib/ai/context-builder'
import {
  buildKiroAutoDraftPrompt,
  buildKiroDocGenerationPrompt,
} from '@/lib/ai/prompts/phase-01'
import { buildAgentPrompt } from '@/lib/ai/agents/prompt-builder'
import { uploadDocument } from '@/lib/storage/documents'
import { slugify } from '@/lib/utils'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { KiroDocumentType } from '@/types/feature'
import type { AgentType } from '@/types/agent'

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
  { params }: { params: Promise<{ id: string; featureId: string; docType: string }> }
) {
  const { id: projectId, featureId, docType } = await params
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const userId = user.id

  const body = await request.json().catch(() => ({}))
  const isAutoDraft = body?.mode === 'auto-draft'

  const docTypeKey = docType as KiroDocumentType
  const section = `feature_${featureId}_${docTypeKey}`

  // For normal mode, require conversation
  let coreMessages: CoreMessage[] = []
  if (!isAutoDraft) {
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
    coreMessages = toCoreMessages(conversation.messages)
  }

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

  const kiroContext = {
    projectName: context.name,
    description: context.description,
    industry: context.industry,
    persona: context.persona,
    discoveryDocs: discoveryDocs.slice(0, 8000),
    previousSpecs: previousSpecs.slice(0, 12000),
    featureName: feature?.name ?? '',
    featureDescription: feature?.description ?? null,
  }

  let systemPrompt: string
  let userMessage: string

  if (isAutoDraft) {
    // --- AUTO-DRAFT MODE: consult specialists + generate without conversation ---
    const full = await buildFullProjectContext(projectId)

    async function consult(agentType: AgentType, instruction: string) {
      const specialistSystem = buildAgentPrompt(agentType, full)
      const { text, usage } = await generateText({
        model: defaultModel,
        system: specialistSystem,
        messages: [
          {
            role: 'user' as const,
            content: `Contexto del feature:\n- Feature: ${feature?.name ?? featureId}\n- Descripcion: ${feature?.description ?? '—'}\n\nTarea:\n${instruction}\n\nIMPORTANTE:\n- Responde con bullets concretos y accionables.\n- No hagas preguntas generales.\n`,
          },
        ],
        maxOutputTokens: 800,
        temperature: 0.3,
      })

      const inputTokens = usage?.inputTokens ?? estimateTokensFromText(specialistSystem + instruction)
      const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
      recordAiUsage(supabase, {
        userId,
        projectId,
        eventType: 'phase01_autodraft_specialist',
        model: defaultModel?.toString?.() ?? undefined,
        inputTokens,
        outputTokens,
      }).catch(() => {})

      return text
    }

    const specialistParts: string[] = []
    if (docTypeKey === 'requirements') {
      const pa = await consult(
        'product_architect',
        'Propone user stories (3-8) y acceptance criteria (2-5 por story) para este feature. Incluye edge cases y out of scope.',
      )
      if (pa) specialistParts.push(`## Product Architect\n${pa}`)
    } else if (docTypeKey === 'tasks') {
      const [ld, qa] = await Promise.all([
        consult(
          'lead_developer',
          'Descompone la implementacion en tasks atomicas (1-4h) ordenadas por dependencias (setup/db/backend/frontend).',
        ),
        consult(
          'qa_engineer',
          'Propone tasks de testing (unit/integration/e2e) y casos de prueba criticos para este feature.',
        ),
      ])
      if (ld) specialistParts.push(`## Lead Developer\n${ld}`)
      if (qa) specialistParts.push(`## QA Engineer\n${qa}`)
    }

    systemPrompt = buildKiroAutoDraftPrompt(docTypeKey, kiroContext, specialistParts.join('\n\n'))
    userMessage = 'Genera el documento completo para este feature.'
  } else {
    // --- NORMAL MODE: use conversation history ---
    systemPrompt = buildKiroDocGenerationPrompt(docTypeKey, kiroContext)
    userMessage = 'Genera el documento completo basado en nuestra conversacion.'
  }

  const featureSlug = slugify(feature?.name ?? featureId)

  try {
    const { text, usage } = await generateText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        ...coreMessages,
        { role: 'user' as const, content: userMessage },
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

    // For auto-draft: create synthetic conversation so refinement chat works
    if (isAutoDraft) {
      const now = new Date().toISOString()
      await supabase
        .from('agent_conversations')
        .upsert(
          {
            project_id: projectId,
            phase_number: 1,
            section,
            agent_type: 'orchestrator',
            messages: [
              { role: 'user', content: 'Genera el documento completo automaticamente.', created_at: now },
              { role: 'assistant', content: 'Documento generado automaticamente. Puedes pedir ajustes en este chat. [SECTION_READY]', created_at: now },
            ],
          },
          { onConflict: 'project_id,phase_number,section,agent_type' },
        )
    }

    // Record AI usage (best effort)
    const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt)
    const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
    recordAiUsage(supabase, {
      userId: user.id,
      projectId,
      eventType: isAutoDraft ? 'phase01_autodraft' : 'phase01_generate',
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
