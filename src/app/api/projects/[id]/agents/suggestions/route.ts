import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext } from '@/lib/ai/context-builder'
import { buildSuggestionsPrompt } from '@/lib/ai/agents/prompt-builder'

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
    const { text } = await generateText({
      model: defaultModel,
      prompt,
      maxOutputTokens: AI_CONFIG.featureSuggestions.maxTokens,
      temperature: AI_CONFIG.featureSuggestions.temperature,
    })

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
