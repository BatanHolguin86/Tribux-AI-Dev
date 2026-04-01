import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { getApprovedFeatureSpecs } from '@/lib/ai/context-builder'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { getActionByName } from '@/lib/actions/action-registry'
import { generateBacklogPrompt } from '@/lib/ai/prompts/action-prompts'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('generate-backlog')!
  let executionId = ''

  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Verify project belongs to user
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json(
        { error: 'not_found', message: 'Proyecto no encontrado.' },
        { status: 404 },
      )
    }

    // 3. Rate limit
    const ip = getClientIp(request)
    const rateLimitKey = `action:${user.id}:${ip}`
    const rateResult = checkRateLimit(rateLimitKey, ACTION_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json(
        { error: 'rate_limited', message: 'Limite de acciones por hora alcanzado. Intenta mas tarde.' },
        { status: 429 },
      )
    }

    // 4. Record action start
    executionId = await recordActionStart(
      projectId,
      actionDef.phaseNumber,
      actionDef.section,
      actionDef.itemIndices[0],
      actionDef.actionName,
    )

    // 5. Load analysis report from KB
    const adminSupabase = await createAdminClient()

    const { data: analysisEntry } = await adminSupabase
      .from('knowledge_base_entries')
      .select('content')
      .eq('project_id', projectId)
      .eq('category', 'analysis')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    const analysisReport = analysisEntry?.content ?? 'No analysis report available yet.'

    // 6. Load feature specs
    const featureSpecs = await getApprovedFeatureSpecs(projectId)

    // 7. Build prompt
    const systemPrompt = generateBacklogPrompt({
      projectName: project.name,
      analysisReport,
      featureSpecs: featureSpecs || 'No feature specs available.',
    })

    // 8. Stream AI generation
    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: 'Generate a prioritized backlog using the RICE framework based on the analysis report.',
        },
      ],
      ...AI_CONFIG.documentGeneration,
      onFinish: async ({ text }) => {
        try {
          // 9. Save backlog to knowledge_base_entries
          const adminSb = await createAdminClient()
          await adminSb
            .from('knowledge_base_entries')
            .insert({
              project_id: projectId,
              title: 'Prioritized Backlog (RICE)',
              category: 'backlog',
              content: text,
              phase_number: 7,
              is_pinned: false,
            })

          // 10. Auto-check backlog items
          await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

          // 11. Record action complete
          await recordActionComplete(
            executionId,
            'success',
            'Backlog generated and saved to knowledge base',
            { savedToKb: true },
          )
        } catch (error) {
          console.error('[generate-backlog] Post-stream error:', error)
          const message = error instanceof Error ? error.message : 'Error desconocido'
          await recordActionComplete(executionId, 'failed', undefined, undefined, message)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[generate-backlog] Error:', error)
    if (executionId) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      await recordActionComplete(executionId, 'failed', undefined, undefined, message)
    }
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: 'action_failed', message },
      { status: 500 },
    )
  }
}
