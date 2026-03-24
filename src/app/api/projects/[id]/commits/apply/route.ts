import { createClient } from '@/lib/supabase/server'
import { commitMultipleFiles } from '@/lib/github/commit'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const applySchema = z.object({
  files: z.array(
    z.object({
      path: z.string().min(1).max(500),
      content: z.string().min(1),
    })
  ).min(1).max(50),
  commitMessage: z.string().min(1).max(500),
  branch: z.string().max(100).optional(),
})

/** Rate limit: 10 commits per hour per user */
const COMMIT_RATE_LIMIT = { maxAttempts: 10, windowMs: 3600_000 }

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Rate limit
    const ip = getClientIp(request)
    const rateLimitKey = `commit-apply:${user.id}:${ip}`
    const rateResult = checkRateLimit(rateLimitKey, COMMIT_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json(
        { error: 'rate_limited', message: 'Limite de commits por hora alcanzado. Intenta mas tarde.' },
        { status: 429 },
      )
    }

    // Validate project belongs to user
    const { data: project } = await supabase
      .from('projects')
      .select('id, repo_url, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json({ error: 'not_found', message: 'Proyecto no encontrado.' }, { status: 404 })
    }

    if (!project.repo_url) {
      return Response.json(
        { error: 'no_repo', message: 'El proyecto no tiene repositorio GitHub conectado.' },
        { status: 400 },
      )
    }

    // Validate input
    const body = await request.json()
    const parsed = applySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Input invalido.' },
        { status: 400 },
      )
    }

    const { files, commitMessage, branch } = parsed.data

    if (!process.env.GITHUB_TOKEN) {
      return Response.json(
        { error: 'config_error', message: 'GITHUB_TOKEN no configurado. Contacta al administrador.' },
        { status: 500 },
      )
    }

    const result = await commitMultipleFiles(
      project.repo_url,
      files,
      commitMessage,
      branch,
    )

    return Response.json({
      success: true,
      sha: result.sha,
      url: result.url,
      filesChanged: result.filesChanged,
    })
  } catch (error) {
    console.error('[Commit apply] Error', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: 'commit_failed', message },
      { status: 500 },
    )
  }
}
