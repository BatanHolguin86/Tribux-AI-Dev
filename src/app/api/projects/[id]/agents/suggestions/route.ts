import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext } from '@/lib/ai/context-builder'

export const maxDuration = 60
import { buildSuggestionsPrompt } from '@/lib/ai/agents/prompt-builder'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const projectContext = await buildFullProjectContext(projectId)
  const prompt = buildSuggestionsPrompt(projectContext)

  try {
    const { text, usage } = await generateText({
      model: defaultModel,
      prompt,
      maxOutputTokens: AI_CONFIG.featureSuggestions.maxTokens,
      temperature: AI_CONFIG.featureSuggestions.temperature,
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

    const parsed = JSON.parse(text)
    return NextResponse.json({
      suggestions: parsed.suggestions ?? [],
      context_summary: {
        current_phase: projectContext.currentPhase,
        phase_name: projectContext.phaseName,
      },
    })
  } catch {
    return NextResponse.json({ suggestions: [], context_summary: { current_phase: projectContext.currentPhase } })
  }
}
