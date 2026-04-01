import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext, getApprovedFeatureSpecs } from '@/lib/ai/context-builder'
import { extractCodeFiles } from '@/lib/ai/code-extractor'
import { commitMultipleFiles } from '@/lib/github/commit'
import { getLatestWorkflowRun } from '@/lib/github/workflows'
import { checkPrerequisites } from '@/lib/actions/prerequisites'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { getActionByName } from '@/lib/actions/action-registry'
import { generateQaReportPrompt } from '@/lib/ai/prompts/action-prompts'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('generate-qa-report')!
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

    // 6. Build context with CI results
    const [context, featureSpecs, ciRun] = await Promise.all([
      buildFullProjectContext(projectId),
      getApprovedFeatureSpecs(projectId),
      project.repo_url ? getLatestWorkflowRun(project.repo_url, 'ci.yml') : Promise.resolve(null),
    ])

    const ciResults = ciRun
      ? `CI Status: ${ciRun.status}\nConclusion: ${ciRun.conclusion ?? 'pending'}\nURL: ${ciRun.html_url}\nUpdated: ${ciRun.updated_at}`
      : 'No CI results available yet.'

    // 7. Build prompt
    const systemPrompt = generateQaReportPrompt({
      projectName: context.name,
      ciResults,
      featureSpecs: featureSpecs || context.featureSpecs,
    })

    // 8. Stream AI generation
    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: 'Generate a comprehensive QA report with test results, findings, and go/no-go recommendation.',
        },
      ],
      ...AI_CONFIG.documentGeneration,
      onFinish: async ({ text }) => {
        try {
          // 9. Extract report file from AI output
          const extractedFiles = extractCodeFiles(text)

          // 10. Commit report to GitHub if files were extracted
          if (extractedFiles.length > 0 && project.repo_url) {
            const filesToCommit = extractedFiles.map((f) => ({
              path: f.path,
              content: f.content,
            }))

            await commitMultipleFiles(
              project.repo_url,
              filesToCommit,
              'docs: add QA report (AI Squad Phase 05)',
            )
          }

          // 11. Save report to knowledge_base_entries
          const adminSupabase = await createAdminClient()
          await adminSupabase
            .from('knowledge_base_entries')
            .insert({
              project_id: projectId,
              title: 'QA Report',
              category: 'qa',
              content: text,
              phase_number: 5,
              is_pinned: false,
            })

          // 12. Auto-check qa_report items
          await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

          // 13. Record action complete
          await recordActionComplete(
            executionId,
            'success',
            'QA report generated and saved',
            {
              files: extractedFiles.map((f) => f.path),
              savedToKb: true,
            },
          )
        } catch (error) {
          console.error('[generate-qa-report] Post-stream error:', error)
          const message = error instanceof Error ? error.message : 'Error desconocido'
          await recordActionComplete(executionId, 'failed', undefined, undefined, message)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[generate-qa-report] Error:', error)
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
