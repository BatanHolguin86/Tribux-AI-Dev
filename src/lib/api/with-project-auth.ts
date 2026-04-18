/**
 * Shared API middleware: validates auth + project ownership + optional rate limiting.
 * Eliminates 60+ lines of duplicated boilerplate across API routes.
 *
 * Usage:
 *   const { user, project, supabase } = await withProjectAuth(request, projectId)
 *   // user and project are guaranteed non-null here
 *
 * Throws ApiError which should be caught and returned as Response.
 */

import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import type { SupabaseClient } from '@supabase/supabase-js'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toResponse(): Response {
    return Response.json(
      { error: this.code, message: this.message },
      { status: this.statusCode },
    )
  }
}

type ProjectAuthResult = {
  user: { id: string; email?: string }
  project: {
    id: string
    repo_url: string | null
    supabase_project_ref: string | null
    supabase_access_token: string | null
    user_id: string
    [key: string]: unknown
  }
  supabase: SupabaseClient
}

type WithProjectAuthOptions = {
  /** Additional project fields to select (beyond id, repo_url, supabase_project_ref, supabase_access_token, user_id) */
  select?: string
  /** Rate limit config. If provided, checks rate limit before auth. */
  rateLimit?: { key: string; maxAttempts: number; windowMs: number }
  /** Require repo_url to be set */
  requireRepo?: boolean
  /** Require supabase_project_ref to be set */
  requireSupabase?: boolean
}

/**
 * Validates authentication, project ownership, and optional rate limiting.
 * Throws ApiError if any check fails — catch it and call .toResponse().
 */
export async function withProjectAuth(
  request: Request,
  projectId: string,
  options: WithProjectAuthOptions = {},
): Promise<ProjectAuthResult> {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new ApiError(401, 'unauthorized', 'No autenticado.')
  }

  // Rate limit check (optional)
  if (options.rateLimit) {
    const ip = getClientIp(request)
    const key = `${options.rateLimit.key}:${user.id}:${ip}`
    const result = checkRateLimit(key, {
      maxAttempts: options.rateLimit.maxAttempts,
      windowMs: options.rateLimit.windowMs,
    })
    if (!result.allowed) {
      throw new ApiError(429, 'rate_limited', 'Demasiados intentos. Intenta mas tarde.')
    }
  }

  // Project ownership check
  const selectFields = options.select
    ? `id, repo_url, supabase_project_ref, supabase_access_token, user_id, ${options.select}`
    : 'id, repo_url, supabase_project_ref, supabase_access_token, user_id'

  const { data: project } = await supabase
    .from('projects')
    .select(selectFields)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    throw new ApiError(404, 'not_found', 'Proyecto no encontrado.')
  }

  const proj = project as unknown as ProjectAuthResult['project']

  // Optional field requirements
  if (options.requireRepo && !proj.repo_url) {
    throw new ApiError(400, 'no_repo', 'El proyecto no tiene repositorio GitHub conectado.')
  }

  if (options.requireSupabase && !proj.supabase_project_ref) {
    throw new ApiError(400, 'no_supabase', 'El proyecto no tiene Supabase configurado.')
  }

  return { user, project: proj, supabase }
}

/**
 * Standard error response format for all API routes.
 */
export function apiError(statusCode: number, code: string, message: string): Response {
  return Response.json({ error: code, message }, { status: statusCode })
}

/**
 * Catch-all error handler for API routes.
 * Converts ApiError to proper response, logs unknown errors.
 */
export function handleApiError(error: unknown, context: string): Response {
  if (error instanceof ApiError) {
    return error.toResponse()
  }

  console.error(`[${context}] Unhandled error:`, error)
  return Response.json(
    { error: 'internal_error', message: 'Error interno del servidor.' },
    { status: 500 },
  )
}
