import { createClient } from '@/lib/supabase/server'
import { createGitHubRelease } from '@/lib/github/workflows'
import { checkPrerequisites } from '@/lib/actions/prerequisites'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { getActionByName } from '@/lib/actions/action-registry'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('trigger-deploy')!
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
      .select('id, repo_url, user_id, name')
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

    // 6. Determine cycle number from previous releases
    const body = await request.json().catch(() => ({}))
    const { cycleNumber } = body as { cycleNumber?: number }
    const cycle = cycleNumber ?? 1

    // 7. Create GitHub release
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const tagName = `v${dateStr}-cycle${cycle}`
    const releaseName = `${project.name} — Cycle ${cycle}`
    const releaseBody = `Production release for ${project.name}.\n\n- Cycle: ${cycle}\n- Date: ${now.toISOString()}\n- Deployed via AI Squad Command Center`

    const releaseResult = await createGitHubRelease(
      project.repo_url!,
      tagName,
      releaseName,
      releaseBody,
    )

    if (!releaseResult.success) {
      await recordActionComplete(executionId, 'failed', undefined, undefined, releaseResult.error)
      return Response.json(
        { error: 'release_failed', message: releaseResult.error },
        { status: 400 },
      )
    }

    // 8. Auto-check deploy_production items
    await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

    // 9. Record action complete
    await recordActionComplete(
      executionId,
      'success',
      `GitHub release ${tagName} created`,
      {
        tagName,
        releaseName,
        html_url: releaseResult.html_url,
      },
    )

    return Response.json({
      success: true,
      tagName,
      releaseName,
      html_url: releaseResult.html_url,
    })
  } catch (error) {
    console.error('[trigger-deploy] Error:', error)
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
