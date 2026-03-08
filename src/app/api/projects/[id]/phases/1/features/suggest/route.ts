import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultModel } from '@/lib/ai/anthropic'
import { getApprovedDiscoveryDocs } from '@/lib/ai/context-builder'
import { buildFeatureSuggestionsPrompt } from '@/lib/ai/prompts/feature-suggestions'

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

  const { text } = await generateText({
    model: defaultModel,
    prompt,
    maxOutputTokens: 2048,
    temperature: 0.6,
  })

  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ features: [] })
  }
}
