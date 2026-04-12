import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { defaultModel, DEFAULT_MODEL_ID, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext } from '@/lib/ai/context-builder'
import { extractCodeFiles } from '@/lib/ai/code-extractor'
import { commitMultipleFiles } from '@/lib/github/commit'
import { checkPrerequisites } from '@/lib/actions/prerequisites'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { recordStreamUsage } from '@/lib/ai/usage'
import { getActionByName } from '@/lib/actions/action-registry'
import { generateRetrospectivePrompt } from '@/lib/ai/prompts/action-prompts'
import { checkHeavyQuota } from '@/lib/plans/quota'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('generate-retrospective')!
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
      .select('id, repo_url, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json(
        { error: 'not_found', message: 'Proyecto no encontrado.' },
        { status: 404 },
      )
    }

    // 3. Check prerequisites
    const prereqResult = await checkPrerequisites(projectId, actionDef.prerequisites)
    if (!prereqResult.met) {
      return Response.json(
        { error: 'prerequisites_not_met', missing: prereqResult.missing },
        { status: 400 },
      )
    }

    // 4. Rate limit
    const ip = getClientIp(request)
    const rateLimitKey = `action:${user.id}:${ip}`
    const rateResult = checkRateLimit(rateLimitKey, ACTION_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json(
        { error: 'rate_limited', message: 'Limite de acciones por hora alcanzado. Intenta mas tarde.' },
        { status: 429 },
      )
    }

    // 5. Record action start
    executionId = await recordActionStart(
      projectId,
      actionDef.phaseNumber,
      actionDef.section,
      actionDef.itemIndices[0],
      actionDef.actionName,
    )

    // 6. Build full project context
    const context = await buildFullProjectContext(projectId)

    // 7. Determine cycle number from body or default
    const body = await request.json().catch(() => ({}))
    const { cycleNumber } = body as { cycleNumber?: number }
    const cycle = cycleNumber ?? 1

    // 8. Build prompt
    const systemPrompt = generateRetrospectivePrompt({
      projectName: context.name,
      cycleNumber: cycle,
      discoveryDocs: context.discoveryDocs,
      featureSpecs: context.featureSpecs,
      repoContext: context.repoContext,
    })

    // 9. Stream AI generation
    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: `Generate a retrospective for cycle ${cycle} covering wins, improvements, and action items.`,
        },
      ],
      ...AI_CONFIG.documentGeneration,
      onFinish: async ({ text, usage }) => {
        await recordStreamUsage({ userId: user.id, projectId, eventType: 'action_generate_retrospective', model: DEFAULT_MODEL_ID, usage })
        try {
          // 10. Extract doc file from AI output
          const extractedFiles = extractCodeFiles(text)

          // 11. Commit to repo if files were extracted
          if (extractedFiles.length > 0 && project.repo_url) {
            const filesToCommit = extractedFiles.map((f) => ({
              path: f.path,
              content: f.content,
            }))

            await commitMultipleFiles(
              project.repo_url,
              filesToCommit,
              `docs: add retrospective for cycle ${cycle} (Tribux Phase 07)`,
            )
          }

          // 12. Save to knowledge_base_entries
          const adminSupabase = await createAdminClient()
          await adminSupabase
            .from('knowledge_base_entries')
            .insert({
              project_id: projectId,
              title: `Retrospective — Cycle ${cycle}`,
              category: 'retrospective',
              content: text,
              phase_number: 7,
              is_pinned: false,
            })

          // 13. Auto-check retrospective items
          await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

          // 14. Record action complete
          await recordActionComplete(
            executionId,
            'success',
            `Retrospective for cycle ${cycle} generated`,
            {
              files: extractedFiles.map((f) => f.path),
              savedToKb: true,
              cycleNumber: cycle,
            },
          )
        } catch (error) {
          console.error('[generate-retrospective] Post-stream error:', error)
          const message = error instanceof Error ? error.message : 'Error desconocido'
          await recordActionComplete(executionId, 'failed', undefined, undefined, message)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[generate-retrospective] Error:', error)
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
