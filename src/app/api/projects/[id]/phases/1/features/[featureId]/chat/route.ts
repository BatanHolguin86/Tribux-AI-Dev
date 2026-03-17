import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildProjectContext, getApprovedDiscoveryDocs, getApprovedFeatureSpecs } from '@/lib/ai/context-builder'
import { buildKiroPrompt } from '@/lib/ai/prompts/phase-01'
import { formatChatErrorResponse } from '@/lib/ai/chat-errors'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import type { KiroDocumentType } from '@/types/feature'

export const maxDuration = 60

type CoreMessage = {
  role: 'user' | 'assistant'
  content: string
}

type StoredMessage = {
  role: string
  content: string
  created_at: string
}

function extractTextFromMessage(message: any): string {
  if (!message) return ''

  if (typeof message.content === 'string') {
    return message.content
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('')
  }

  if (Array.isArray(message.content)) {
    return message.content
      .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('')
  }

  if (typeof message.text === 'string') {
    return message.text
  }

  return ''
}

function toCoreMessages(rawMessages: unknown): CoreMessage[] {
  if (!Array.isArray(rawMessages)) return []

  return rawMessages.map((m: any) => ({
    role: (m?.role ?? 'user') as CoreMessage['role'],
    content: extractTextFromMessage(m),
  }))
}

function toStoredMessages(rawMessages: unknown): StoredMessage[] {
  if (!Array.isArray(rawMessages)) return []

  const now = new Date().toISOString()

  return rawMessages.map((m: any) => ({
    role: m?.role ?? 'user',
    content: extractTextFromMessage(m),
    created_at: m?.created_at ?? now,
  }))
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; featureId: string }> }
) {
  try {
    const { id: projectId, featureId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

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

  const coreMessages = toCoreMessages(messages)
  const storedBaseMessages = toStoredMessages(messages)

  const result = streamText({
    model: defaultModel,
    system: systemPrompt,
    messages: coreMessages,
    ...AI_CONFIG.chat,
    onFinish: async ({ text, usage }) => {
      const allMessages = [
        ...storedBaseMessages,
        {
          role: 'assistant',
          content: text,
          created_at: new Date().toISOString(),
        },
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

      // Record AI usage for financial backoffice
      const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt + coreMessages.map(m => m.content).join(''))
      const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
      recordAiUsage(supabase, {
        userId: user.id,
        projectId,
        eventType: 'phase01_chat',
        model: defaultModel?.toString?.() ?? undefined,
        inputTokens,
        outputTokens,
      }).catch(() => {})
    },
  })

    return result.toTextStreamResponse()
  } catch (error: unknown) {
    console.error('[Phase-01 feature chat] Error', error)
    const { status, body } = formatChatErrorResponse(error)
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
