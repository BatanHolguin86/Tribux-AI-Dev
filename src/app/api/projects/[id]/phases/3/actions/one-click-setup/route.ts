import { createClient, createAdminClient } from '@/lib/supabase/server'
import { slugifyProjectName, createRepository } from '@/lib/platform/github'
import {
  createProject as createSupabaseProject,
  pollUntilReady,
  getProjectApiKeys,
  getProjectApiUrl,
} from '@/lib/platform/supabase'
import { createProject as createVercelProject } from '@/lib/platform/vercel'
import { autoCheckItems } from '@/lib/actions/auto-check'
import { recordActionStart, recordActionComplete } from '@/lib/actions/execute'
import { checkRateLimit, getClientIp, ACTION_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 300

type SSEEvent = {
  step: 'github' | 'supabase' | 'vercel' | 'complete'
  status: 'running' | 'polling' | 'done' | 'error'
  message: string
  data?: Record<string, unknown>
}

function createSSEStream() {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(c) { controller = c },
  })

  function emit(event: SSEEvent) {
    controller?.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
  }

  function close() {
    controller?.close()
  }

  return { stream, emit, close }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Use admin client for project query to bypass RLS (user already verified above)
  const adminSupabase = await createAdminClient()
  const { data: project, error: projectError } = await adminSupabase
    .from('projects')
    .select('id, name, repo_url, supabase_project_ref, vercel_project_id, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    console.error('[one-click-setup] Project query failed', { projectId, userId: user.id, error: projectError })
    return Response.json(
      { error: 'not_found', message: projectError?.message ?? 'Proyecto no encontrado' },
      { status: 404 },
    )
  }

  // Check if already fully configured
  if (project.repo_url && project.supabase_project_ref && project.vercel_project_id) {
    return Response.json(
      { error: 'already_configured', message: 'Este proyecto ya tiene infraestructura configurada.' },
      { status: 409 },
    )
  }

  // Rate limit
  const ip = getClientIp(request)
  const rateResult = checkRateLimit(`setup:${user.id}:${ip}`, ACTION_RATE_LIMIT)
  if (!rateResult.allowed) {
    return Response.json({ error: 'rate_limited' }, { status: 429 })
  }

  let executionId = ''
  try {
    executionId = await recordActionStart(projectId, 3, 'repository', 0, 'one-click-setup')
  } catch { /* non-fatal */ }

  const { stream, emit, close } = createSSEStream()

  // Run setup in background (non-blocking)
  const setupPromise = (async () => {
    let repoUrl = project.repo_url
    let supabaseRef = project.supabase_project_ref
    let vercelProjectId = project.vercel_project_id

    // ── Step 1: GitHub ──────────────────────────────────────────────────
    if (!repoUrl) {
      emit({ step: 'github', status: 'running', message: 'Creando repositorio en GitHub...' })
      try {
        const slug = slugifyProjectName(project.name)
        const result = await createRepository(slug, project.name)
        repoUrl = result.repoUrl

        await supabase
          .from('projects')
          .update({ repo_url: repoUrl })
          .eq('id', projectId)

        emit({ step: 'github', status: 'done', message: 'Repositorio creado', data: { repoUrl } })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al crear repositorio'
        emit({ step: 'github', status: 'error', message: msg })
        if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, msg)
        close()
        return
      }
    } else {
      emit({ step: 'github', status: 'done', message: 'Repositorio ya configurado', data: { repoUrl } })
    }

    // ── Step 2: Supabase ────────────────────────────────────────────────
    if (!supabaseRef) {
      emit({ step: 'supabase', status: 'running', message: 'Creando proyecto Supabase...' })
      try {
        const { projectRef, dbPassword } = await createSupabaseProject(project.name)
        supabaseRef = projectRef

        emit({ step: 'supabase', status: 'polling', message: 'Esperando que Supabase este listo...' })
        await pollUntilReady(projectRef, (msg) => {
          emit({ step: 'supabase', status: 'polling', message: msg })
        })

        const keys = await getProjectApiKeys(projectRef)
        const apiUrl = getProjectApiUrl(projectRef)

        await supabase
          .from('projects')
          .update({
            supabase_project_ref: projectRef,
            supabase_access_token: keys.serviceRoleKey,
            supabase_api_url: apiUrl,
            supabase_anon_key: keys.anonKey,
            supabase_db_password: dbPassword,
          })
          .eq('id', projectId)

        emit({ step: 'supabase', status: 'done', message: 'Base de datos lista', data: { projectRef, apiUrl } })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al crear Supabase'
        emit({ step: 'supabase', status: 'error', message: msg })
        if (executionId) await recordActionComplete(executionId, 'failed', undefined, undefined, msg)
        close()
        return
      }
    } else {
      emit({ step: 'supabase', status: 'done', message: 'Supabase ya configurado', data: { projectRef: supabaseRef } })
    }

    // ── Step 3: Vercel ──────────────────────────────────────────────────
    if (!vercelProjectId && repoUrl) {
      emit({ step: 'vercel', status: 'running', message: 'Creando proyecto en Vercel...' })
      try {
        const slug = slugifyProjectName(project.name)
        const result = await createVercelProject(slug, repoUrl)
        vercelProjectId = result.projectId

        await supabase
          .from('projects')
          .update({
            vercel_project_id: result.projectId,
            vercel_project_url: result.url,
          })
          .eq('id', projectId)

        emit({ step: 'vercel', status: 'done', message: 'Hosting configurado', data: { projectId: result.projectId, url: result.url } })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al crear Vercel'
        emit({ step: 'vercel', status: 'error', message: msg })
        // Vercel failure is non-fatal — repo and DB are still usable
      }
    } else {
      emit({ step: 'vercel', status: 'done', message: 'Vercel ya configurado' })
    }

    // ── Auto-check Phase 03 items ─────────────────────────────────────
    try {
      if (repoUrl) await autoCheckItems(projectId, 3, 'repository', [0, 3])
      if (supabaseRef) await autoCheckItems(projectId, 3, 'database', [0])
      if (vercelProjectId) await autoCheckItems(projectId, 3, 'hosting', [0, 1])
    } catch { /* non-fatal */ }

    if (executionId) {
      await recordActionComplete(executionId, 'success', 'Infraestructura creada', {
        repoUrl, supabaseRef, vercelProjectId,
      })
    }

    emit({
      step: 'complete',
      status: 'done',
      message: 'Infraestructura lista',
      data: { repoUrl, supabaseRef, vercelProjectId },
    })
    close()
  })()

  // Don't await — let the stream start immediately
  setupPromise.catch((err) => {
    console.error('[one-click-setup] Unhandled error:', err)
    emit({ step: 'complete', status: 'error', message: 'Error inesperado' })
    close()
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
