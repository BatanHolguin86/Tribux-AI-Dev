import { createClient } from '@/lib/supabase/server'
import { parseGitHubUrl } from '@/lib/github/repo-context'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { getActionByName } from '@/lib/actions/action-registry'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'
import { getPlatformToken } from '@/lib/platform/config'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actionDef = getActionByName('collect-metrics')!
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

    const metrics: Record<string, unknown> = {
      collectedAt: new Date().toISOString(),
      vercel: null,
      sentry: null,
    }

    // 5. Collect Vercel Analytics if token available
    let vercelToken = process.env.VERCEL_TOKEN ?? ''
    let vercelTeamId = process.env.VERCEL_TEAM_ID ?? ''
    try {
      const platform = await getPlatformToken('vercel')
      vercelToken = platform.token
      vercelTeamId = platform.metadata.team_id ?? vercelTeamId
    } catch { /* fallback to VERCEL_TOKEN env var */ }

    if (vercelToken) {
      try {
        const parsed = project.repo_url ? parseGitHubUrl(project.repo_url) : null
        const repoName = parsed ? parsed.repo : null

        if (repoName) {
          const teamParam = vercelTeamId ? `&teamId=${vercelTeamId}` : ''

          // Fetch recent deployments for basic metrics
          const deploymentsRes = await fetch(
            `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(repoName)}&limit=5${teamParam}`,
            {
              headers: { Authorization: `Bearer ${vercelToken}` },
            },
          )

          if (deploymentsRes.ok) {
            const data = await deploymentsRes.json()
            metrics.vercel = {
              recentDeployments: (data.deployments ?? []).map((d: Record<string, unknown>) => ({
                url: d.url,
                state: d.readyState ?? d.state,
                created: d.created,
              })),
              deploymentCount: data.deployments?.length ?? 0,
            }
          }
        }
      } catch (vercelError) {
        console.error('[collect-metrics] Vercel API error (non-fatal):', vercelError)
        metrics.vercel = { error: 'Failed to fetch Vercel metrics' }
      }
    } else {
      metrics.vercel = { skipped: true, reason: 'VERCEL_TOKEN not configured' }
    }

    // 6. Collect Sentry error stats if token available
    if (process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT) {
      try {
        const sentryRes = await fetch(
          `https://sentry.io/api/0/projects/${process.env.SENTRY_ORG}/${process.env.SENTRY_PROJECT}/stats/?stat=received&resolution=1d`,
          {
            headers: { Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}` },
          },
        )

        if (sentryRes.ok) {
          const data = await sentryRes.json()
          metrics.sentry = {
            errorStats: data,
            period: '24h',
          }
        }
      } catch (sentryError) {
        console.error('[collect-metrics] Sentry API error (non-fatal):', sentryError)
        metrics.sentry = { error: 'Failed to fetch Sentry metrics' }
      }
    } else {
      metrics.sentry = { skipped: true, reason: 'SENTRY_AUTH_TOKEN not configured' }
    }

    // 7. Auto-check metrics items
    await autoCheckItems(projectId, actionDef.phaseNumber, actionDef.section, actionDef.itemIndices)

    // 8. Record action complete with metrics in result_data
    await recordActionComplete(
      executionId,
      'success',
      'Metrics collected successfully',
      metrics,
    )

    return Response.json({
      success: true,
      metrics,
    })
  } catch (error) {
    console.error('[collect-metrics] Error:', error)
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
