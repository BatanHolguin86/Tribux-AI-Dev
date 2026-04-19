import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { getApprovedDiscoveryDocs, getApprovedFeatureSpecs } from '@/lib/ai/context-builder'
import { buildDesignGenerationPrompt } from '@/lib/ai/prompts/design-generation'
import { generateDesignSchema } from '@/lib/validations/designs'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { DESIGN_RATE_LIMIT } from '@/lib/rate-limit'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'

export const maxDuration = 120

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Rate limit: 10 generations/hour/user
    const ip = getClientIp(request)
    const rateLimitKey = `design-gen:${user.id}:${ip}`
    const rateResult = checkRateLimit(rateLimitKey, DESIGN_RATE_LIMIT)
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Has alcanzado el limite de generaciones. Intenta en unos minutos.' },
        { status: 429 },
      )
    }

    // Validate request body
    const body = await request.json()
    const parsed = generateDesignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // Verify Phase 01 has progress — either completed or active with at least one feature spec
    const { data: phase01 } = await supabase
      .from('project_phases')
      .select('status')
      .eq('project_id', projectId)
      .eq('phase_number', 1)
      .single()

    if (!phase01 || phase01.status === 'locked') {
      return NextResponse.json(
        { error: 'phase_incomplete', message: 'Completa Phase 01 (Requirements & Spec) antes de generar disenos.' },
        { status: 400 },
      )
    }

    // If Phase 01 is active (not yet formally approved), require at least one feature with specs
    if (phase01.status === 'active') {
      const { count } = await supabase
        .from('project_features')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .in('status', ['spec_complete', 'approved', 'in_progress'])

      if (!count || count === 0) {
        return NextResponse.json(
          { error: 'phase_incomplete', message: 'Define al menos un feature en Phase 01 antes de generar disenos.' },
          { status: 400 },
        )
      }
    }

    // Get project info for context
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Build context
    const discoveryDocs = await getApprovedDiscoveryDocs(projectId)
    const featureSpecs = await getApprovedFeatureSpecs(projectId)

    // Stream generation to keep connection alive on Vercel Hobby (10s timeout for non-streaming)
    // Generate ONE artifact PER screen sequentially, streaming tokens to keep alive
    const encoder = new TextEncoder()
    const responseStream = new ReadableStream({
      async start(controller) {
        const results: Array<{ screen: string; artifactId: string; success: boolean }> = []

        try {
          for (const screen of parsed.data.screens) {
            controller.enqueue(encoder.encode(`generating:${screen}\n`))

            const systemPrompt = buildDesignGenerationPrompt({
              projectName: project.name,
              screens: [screen],
              type: parsed.data.type,
              featureSpecs,
              discoveryDocs,
              refinement: parsed.data.refinement,
            })

            const { data: artifact, error: insertError } = await supabase
              .from('design_artifacts')
              .insert({
                project_id: projectId,
                type: parsed.data.type,
                screen_name: screen,
                status: 'generating',
                prompt_used: systemPrompt.slice(0, 2000),
                storage_path: '',
                mime_type: 'text/markdown',
              })
              .select('id')
              .single()

            if (insertError || !artifact) {
              results.push({ screen, artifactId: '', success: false })
              continue
            }

            try {
              const result = streamText({
                model: defaultModel,
                system: systemPrompt,
                messages: [
                  {
                    role: 'user',
                    content: `Genera el HTML visual para la pantalla: ${screen}. Responde SOLO con HTML completo, sin markdown.`,
                  },
                ],
                ...AI_CONFIG.designPrompts,
              })

              // Stream tokens to keep connection alive
              let fullText = ''
              for await (const chunk of result.textStream) {
                controller.enqueue(encoder.encode(chunk))
                fullText += chunk
              }

              let text = fullText.trim()
              if (text.startsWith('```')) {
                text = text.replace(/^```(?:html)?\s*\n?/, '').replace(/\n?```\s*$/, '')
              }

              const usageData = await result.usage

              // Upload to storage (best effort)
              const storagePath = `projects/${projectId}/designs/${artifact.id}.html`
              try {
                const blob = new Blob([text], { type: 'text/html' })
                await supabase.storage
                  .from('project-designs')
                  .upload(storagePath, blob, { contentType: 'text/html', upsert: true })
              } catch (err) {
                console.error('[Design generate] Storage upload failed', err)
              }

              await supabase
                .from('design_artifacts')
                .update({ storage_path: storagePath, status: 'draft', content: text })
                .eq('id', artifact.id)

              const inputTokens = usageData?.inputTokens ?? estimateTokensFromText(systemPrompt)
              const outputTokens = usageData?.outputTokens ?? estimateTokensFromText(text)
              recordAiUsage(supabase, {
                userId: user.id,
                projectId,
                eventType: 'design_generate',
                model: defaultModel?.toString?.() ?? undefined,
                inputTokens,
                outputTokens,
              }).catch(() => {})

              results.push({ screen, artifactId: artifact.id, success: true })
              controller.enqueue(encoder.encode(`\ndone:${screen}\n`))
            } catch (err) {
              console.error('[Design generate] Generation failed for', screen, err)
              await supabase.from('design_artifacts').update({ status: 'draft' }).eq('id', artifact.id)
              results.push({ screen, artifactId: artifact.id, success: false })
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(responseStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('[Design generate] Error', error)
    return NextResponse.json(
      { error: 'Error al generar diseno' },
      { status: 500 },
    )
  }
}
