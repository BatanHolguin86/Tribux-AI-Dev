import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, DEFAULT_MODEL_ID, AI_CONFIG } from '@/lib/ai/anthropic'
import { extractCodeFiles } from '@/lib/ai/code-extractor'
import { commitMultipleFiles } from '@/lib/github/commit'
import { fetchFileContent } from '@/lib/github/file-content'
import { getGitHubRepoContext, formatRepoContext } from '@/lib/github/repo-context'
import { checkPrerequisites } from '@/lib/actions/prerequisites'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { recordStreamUsage } from '@/lib/ai/usage'
import { checkHeavyQuota } from '@/lib/plans/quota'
import { getActionByName } from '@/lib/actions/action-registry'
import { setupDeployWorkflowPrompt } from '@/lib/ai/prompts/action-prompts'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actionDef = getActionByName('setup-deploy-workflow')!
  let executionId = ''

  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // 1. Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    // Quota check
    const quotaBlock = await checkHeavyQuota(user.id)
    if (quotaBlock) return quotaBlock

    // 2. Project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, repo_url, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json({ error: 'not_found', message: 'Proyecto no encontrado.' }, { status: 404 })
    }

    // 3. Prerequisites
    const prereqResult = await checkPrerequisites(projectId, actionDef.prerequisites)
    if (!prereqResult.met) {
      return Response.json({ error: 'prerequisites_not_met', missing: prereqResult.missing }, { status: 400 })
    }

    // 4. Rate limit
    const ip = getClientIp(request)
    const rateResult = checkRateLimit(`action:${user.id}:${ip}`, ACTION_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json({ error: 'rate_limited', message: 'Limite de acciones por hora alcanzado.' }, { status: 429 })
    }

    // 5. Record start
    executionId = await recordActionStart(
      projectId,
      actionDef.phaseNumber,
      actionDef.section,
      actionDef.itemIndices[0],
      actionDef.actionName,
    )

    // 6. Build context
    let repoContext = ''
    let packageJson = '{}'

    if (project.repo_url) {
      try {
        repoContext = formatRepoContext(await getGitHubRepoContext(project.repo_url))
      } catch { /* non-fatal */ }

      const fetched = await fetchFileContent(project.repo_url, 'package.json').catch(() => null)
      if (fetched) packageJson = fetched
    }

    const prompt = setupDeployWorkflowPrompt({
      projectName: project.name,
      repoContext,
      packageJson,
    })

    // 7. Stream generation
    const result = streamText({
      model: defaultModel,
      messages: [{ role: 'user', content: prompt }],
      ...AI_CONFIG,
      onFinish: async ({ text, usage }) => {
        try {
          const files = extractCodeFiles(text)
          if (files.length > 0 && project.repo_url) {
            await commitMultipleFiles(
              project.repo_url,
              files,
              'ci: add GitHub Actions deploy workflow (Vercel)',
              'main',
            )
          }

          await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)
          await recordActionComplete(
            executionId,
            'success',
            'Deploy workflow generado. Configura los 3 secrets en GitHub: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID',
            { files: files.map((f) => f.path), setupRequired: true },
          )
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Error al commitear workflow'
          await recordActionComplete(executionId, 'failed', undefined, undefined, msg)
        }

        await recordStreamUsage({
          userId: user.id,
          projectId,
          eventType: 'action_generate_ops_runbook',
          model: DEFAULT_MODEL_ID,
          usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
        })
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[setup-deploy-workflow] Error:', error)
    if (executionId) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      await recordActionComplete(executionId, 'failed', undefined, undefined, message)
    }
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json({ error: 'action_failed', message }, { status: 500 })
  }
}
