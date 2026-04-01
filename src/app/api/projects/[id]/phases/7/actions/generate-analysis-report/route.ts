import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { defaultModel, DEFAULT_MODEL_ID, AI_CONFIG } from '@/lib/ai/anthropic'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { recordStreamUsage } from '@/lib/ai/usage'
import { getActionByName } from '@/lib/actions/action-registry'
import { generateAnalysisReportPrompt } from '@/lib/ai/prompts/action-prompts'
import { checkHeavyQuota } from '@/lib/plans/quota'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('generate-analysis-report')!
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

    // Quota check — block heavy AI ops if budget exceeded
    const quotaBlock = await checkHeavyQuota(user.id)
    if (quotaBlock) return quotaBlock

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

    // 5. Load metrics from previous collect-metrics execution
    const adminSupabase = await createAdminClient()

    const { data: metricsExecution } = await adminSupabase
      .from('action_executions')
      .select('result_data')
      .eq('project_id', projectId)
      .eq('action_name', 'collect-metrics')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    const metricsContext = metricsExecution?.result_data
      ? JSON.stringify(metricsExecution.result_data, null, 2)
      : ''

    // 6. Load KB entries for feedback
    const { data: feedbackEntries } = await adminSupabase
      .from('knowledge_base_entries')
      .select('title, content, category')
      .eq('project_id', projectId)
      .in('category', ['feedback', 'user_feedback', 'bug_report'])
      .order('updated_at', { ascending: false })
      .limit(10)

    const feedbackContext = (feedbackEntries ?? [])
      .map((e) => `### ${e.title}\n${e.content ?? ''}`)
      .join('\n\n')

    // 7. Build prompt
    const systemPrompt = generateAnalysisReportPrompt({
      projectName: project.name,
      metrics: metricsContext,
      feedback: feedbackContext,
    })

    // 8. Stream AI generation
    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: 'Generate an analysis report based on the collected metrics and user feedback.',
        },
      ],
      ...AI_CONFIG.documentGeneration,
      onFinish: async ({ text, usage }) => {
        await recordStreamUsage({ userId: user.id, projectId, eventType: 'action_generate_analysis_report', model: DEFAULT_MODEL_ID, usage })
        try {
          // 9. Save report to knowledge_base_entries
          const adminSb = await createAdminClient()
          await adminSb
            .from('knowledge_base_entries')
            .insert({
              project_id: projectId,
              title: 'Analysis Report',
              category: 'analysis',
              content: text,
              phase_number: 7,
              is_pinned: false,
            })

          // 10. Auto-check feedback items
          await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

          // 11. Record action complete
          await recordActionComplete(
            executionId,
            'success',
            'Analysis report generated and saved to knowledge base',
            { savedToKb: true },
          )
        } catch (error) {
          console.error('[generate-analysis-report] Post-stream error:', error)
          const message = error instanceof Error ? error.message : 'Error desconocido'
          await recordActionComplete(executionId, 'failed', undefined, undefined, message)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[generate-analysis-report] Error:', error)
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
