import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultModel } from '@/lib/ai/anthropic'
import { getApprovedDiscoveryDocs } from '@/lib/ai/context-builder'
import { buildFeatureSuggestionsPrompt } from '@/lib/ai/prompts/feature-suggestions'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single()

  const discoveryDocs = await getApprovedDiscoveryDocs(projectId)
  const prompt = buildFeatureSuggestionsPrompt(project?.name ?? '', discoveryDocs)

  const { text, usage } = await generateText({
    model: defaultModel,
    prompt,
    maxOutputTokens: 2048,
    temperature: 0.6,
  })

  // Record AI usage for financial backoffice
  const inputTokens = usage?.inputTokens ?? estimateTokensFromText(prompt)
  const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
  recordAiUsage(supabase, {
    userId: user.id,
    projectId,
    eventType: 'suggestions',
    model: defaultModel?.toString?.() ?? undefined,
    inputTokens,
    outputTokens,
  }).catch(() => {})

  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ features: [] })
  }
}
