import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildDesignRefinePrompt } from '@/lib/ai/prompts/design-generation'
import { refineDesignSchema } from '@/lib/validations/designs'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { DESIGN_RATE_LIMIT } from '@/lib/rate-limit'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'

export const maxDuration = 120

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; artifactId: string }> },
) {
  try {
    const { id: projectId, artifactId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Rate limit
    const ip = getClientIp(request)
    const rateLimitKey = `design-refine:${user.id}:${ip}`
    const rateResult = checkRateLimit(rateLimitKey, DESIGN_RATE_LIMIT)
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Has alcanzado el limite de refinamientos. Intenta en unos minutos.' },
        { status: 429 },
      )
    }

    // Validate request body
    const body = await request.json()
    const parsed = refineDesignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // Fetch existing artifact
    const { data: artifact, error: artifactError } = await supabase
      .from('design_artifacts')
      .select('*')
      .eq('id', artifactId)
      .eq('project_id', projectId)
      .single()

    if (artifactError || !artifact) {
      return NextResponse.json({ error: 'Artefacto no encontrado' }, { status: 404 })
    }

    // Get existing content
    let existingContent = ''
    if (artifact.storage_path) {
      const { data: fileData } = await supabase.storage
        .from('project-designs')
        .download(artifact.storage_path)

      if (fileData) {
        existingContent = await fileData.text()
      }
    }

    if (!existingContent) {
      return NextResponse.json(
        { error: 'No hay contenido para refinar' },
        { status: 400 },
      )
    }

    // Get project name
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    const systemPrompt = buildDesignRefinePrompt({
      projectName: project?.name ?? 'Proyecto',
      existingContent,
      instruction: parsed.data.instruction,
    })

    // Update artifact status to generating
    await supabase
      .from('design_artifacts')
      .update({ status: 'generating' })
      .eq('id', artifactId)

    // Generate refined design using generateText (not streamText)
    const { text, usage } = await generateText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: parsed.data.instruction,
        },
      ],
      ...AI_CONFIG.designPrompts,
    })

    // Upload to storage (best effort)
    const storagePath = artifact.storage_path || `projects/${projectId}/designs/${artifactId}.md`
    try {
      const blob = new Blob([text], { type: 'text/markdown' })
      await supabase.storage
        .from('project-designs')
        .upload(storagePath, blob, {
          contentType: 'text/markdown',
          upsert: true,
        })
    } catch (err) {
      console.error('[Design refine] Storage upload failed', err)
    }

    // Save content in DB (reliable)
    await supabase
      .from('design_artifacts')
      .update({
        storage_path: storagePath,
        status: 'draft',
        content: text,
        prompt_used: parsed.data.instruction.slice(0, 2000),
      })
      .eq('id', artifactId)

    // Record AI usage
    const inputTokens = usage?.inputTokens ?? estimateTokensFromText(systemPrompt + parsed.data.instruction)
    const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
    recordAiUsage(supabase, {
      userId: user.id,
      projectId,
      eventType: 'design_refine',
      model: defaultModel?.toString?.() ?? undefined,
      inputTokens,
      outputTokens,
    }).catch(() => {})

    return Response.json({ success: true, artifactId })
  } catch (error) {
    console.error('[Design refine] Error', error)
    return NextResponse.json({ error: 'Error al refinar diseno' }, { status: 500 })
  }
}
