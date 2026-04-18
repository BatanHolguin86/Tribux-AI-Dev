import { createClient } from '@/lib/supabase/server'
import { createGitHubRelease, getLatestGitHubDeployment, getRollbackTarget, createRollbackRelease } from '@/lib/github/workflows'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 120

type SSEEvent = {
  step: 'deploy' | 'polling' | 'smoke' | 'rollback' | 'complete'
  status: 'running' | 'done' | 'error'
  message: string
  data?: Record<string, unknown>
}

function createSSEStream() {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null
  const stream = new ReadableStream<Uint8Array>({ start(c) { controller = c } })
  function emit(event: SSEEvent) {
    controller?.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
  }
  function close() { controller?.close() }
  return { stream, emit, close }
}

/**
 * POST /api/projects/[id]/phases/6/actions/auto-deploy
 * Full autonomous deploy: create release → poll deployment → smoke test → auto-rollback on failure
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const ip = getClientIp(request)
  const rateResult = checkRateLimit(`autodeploy:${user.id}:${ip}`, ACTION_RATE_LIMIT)
  if (!rateResult.allowed) return Response.json({ error: 'rate_limited' }, { status: 429 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, repo_url, vercel_project_url, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project?.repo_url) {
    return Response.json({ error: 'No hay repositorio configurado.' }, { status: 400 })
  }

  let executionId = ''
  try {
    executionId = await recordActionStart(projectId, 6, 'deploy_production', 0, 'auto-deploy')
  } catch { /* non-fatal */ }

  const { stream, emit, close } = createSSEStream()

  const pipeline = (async () => {
    try {
      // Step 1: Create release to trigger deploy
      emit({ step: 'deploy', status: 'running', message: 'Creando release para deploy...' })

      const now = new Date()
      const tagName = `v${now.toISOString().slice(0, 10).replace(/-/g, '.')}.${now.getHours()}${now.getMinutes()}`
      const result = await createGitHubRelease(
        project.repo_url!,
        tagName,
        `Release ${tagName}`,
        `Deploy automatico desde Tribux AI — ${now.toISOString()}`,
      )

      if (!result.success) {
        emit({ step: 'deploy', status: 'error', message: result.error ?? 'Error al crear release' })
        if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, result.error)
        close()
        return
      }

      emit({ step: 'deploy', status: 'done', message: `Release ${tagName} creado`, data: { tagName, url: result.html_url } })

      // Step 2: Poll for deployment (wait up to 3 minutes)
      emit({ step: 'polling', status: 'running', message: 'Esperando que Vercel despliegue...' })

      let deployUrl: string | null = project.vercel_project_url ?? null
      const maxWait = 180_000
      const start = Date.now()
      let attempt = 0

      while (Date.now() - start < maxWait) {
        attempt++
        const elapsed = Math.round((Date.now() - start) / 1000)
        emit({ step: 'polling', status: 'running', message: `Esperando deploy... (${elapsed}s)` })

        const deployment = await getLatestGitHubDeployment(project.repo_url!, 'Production')
        if (deployment?.status === 'success' && deployment.environmentUrl) {
          deployUrl = deployment.environmentUrl
          break
        }

        await new Promise((r) => setTimeout(r, Math.min(5000 + attempt * 2000, 15000)))
      }

      if (!deployUrl) {
        emit({ step: 'polling', status: 'error', message: 'Deploy no completo en 3 minutos' })
        if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, 'Deploy timeout')
        close()
        return
      }

      emit({ step: 'polling', status: 'done', message: `Desplegado en ${deployUrl}`, data: { deployUrl } })

      // Step 3: Smoke test
      emit({ step: 'smoke', status: 'running', message: 'Ejecutando smoke test...' })

      const checks: Array<{ name: string; pass: boolean; detail: string }> = []

      // Check homepage
      try {
        const res = await fetch(deployUrl, { redirect: 'follow' })
        checks.push({ name: 'Homepage carga', pass: res.ok, detail: `HTTP ${res.status}` })
      } catch (err) {
        checks.push({ name: 'Homepage carga', pass: false, detail: err instanceof Error ? err.message : 'Error' })
      }

      // Check API health
      try {
        const res = await fetch(`${deployUrl}/api/auth/login`, { method: 'HEAD' })
        checks.push({ name: 'API responde', pass: res.status < 500, detail: `HTTP ${res.status}` })
      } catch {
        checks.push({ name: 'API responde', pass: false, detail: 'No responde' })
      }

      const allPassed = checks.every((c) => c.pass)

      if (allPassed) {
        emit({ step: 'smoke', status: 'done', message: 'Smoke test exitoso', data: { checks } })
        emit({ step: 'complete', status: 'done', message: 'Deploy exitoso. Tu app esta en produccion.', data: { deployUrl, tagName } })

        if (executionId) {
          await recordActionComplete(executionId, 'success', `Deploy ${tagName} exitoso`, { deployUrl, tagName, checks })
        }
        close()
        return
      }

      // Step 4: Auto-rollback
      emit({ step: 'smoke', status: 'error', message: 'Smoke test fallo. Iniciando rollback...', data: { checks } })
      emit({ step: 'rollback', status: 'running', message: 'Buscando version anterior...' })

      const rollbackTarget = await getRollbackTarget(project.repo_url!)

      if (!rollbackTarget) {
        emit({ step: 'rollback', status: 'error', message: 'No hay version anterior para rollback' })
        if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, 'Smoke failed, no rollback target')
        close()
        return
      }

      const rollbackResult = await createRollbackRelease(project.repo_url!, rollbackTarget.commitSha, rollbackTarget.tag)

      if (rollbackResult.success) {
        emit({ step: 'rollback', status: 'done', message: `Rollback a ${rollbackTarget.tag} ejecutado`, data: { rollbackTag: rollbackResult.tagName } })
        emit({
          step: 'complete',
          status: 'error',
          message: `Deploy fallo smoke test. Se revirtio a ${rollbackTarget.tag} automaticamente.`,
          data: { checks, rollbackTo: rollbackTarget.tag },
        })
      } else {
        emit({ step: 'rollback', status: 'error', message: rollbackResult.error ?? 'Error en rollback' })
      }

      if (executionId) {
        await recordActionComplete(executionId, 'failed', `Deploy fallo, rollback a ${rollbackTarget.tag}`, { checks, rollbackTarget })
      }
      close()
    } catch (err) {
      emit({ step: 'complete', status: 'error', message: 'Error inesperado' })
      if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, String(err))
      close()
    }
  })()

  pipeline.catch((err) => {
    console.error('[auto-deploy] Unhandled:', err)
    close()
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  })
}
