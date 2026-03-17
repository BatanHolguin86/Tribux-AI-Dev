import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultModel } from '@/lib/ai/anthropic'
import { getApprovedDiscoveryDocs } from '@/lib/ai/context-builder'
import { buildFeatureSuggestionsPrompt } from '@/lib/ai/prompts/feature-suggestions'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'

export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'missing_api_key', message: 'Falta ANTHROPIC_API_KEY en el servidor.' },
      { status: 500 },
    )
  }

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

  if (!discoveryDocs.trim()) {
    return NextResponse.json(
      { error: 'no_discovery', message: 'Completa y aprueba el Discovery (Phase 00) antes de pedir sugerencias.' },
      { status: 400 },
    )
  }

  const prompt = buildFeatureSuggestionsPrompt(project?.name ?? '', discoveryDocs)

  try {
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

    // Strip markdown code fences if present (e.g. ```json ... ```)
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[Feature suggest] Error', err)
    const errMsg = err instanceof Error ? err.message : String(err)
    const isCredits = errMsg.toLowerCase().includes('credit')
    return NextResponse.json(
      {
        error: 'generation_failed',
        message: isCredits
          ? 'Creditos de Anthropic insuficientes. Agrega creditos en console.anthropic.com.'
          : `Error al generar sugerencias: ${errMsg.slice(0, 200)}`,
      },
      { status: isCredits ? 402 : 500 },
    )
  }
}
