/**
 * Standardized API response helpers.
 * Ensures consistent error/success format across all 123+ API routes.
 *
 * Error format:  { error: string, message: string, code?: string, details?: unknown }
 * Success format: { ...data } or { ok: true }
 */

export function successResponse(data: Record<string, unknown> = { ok: true }, status = 200): Response {
  return Response.json(data, { status })
}

export function errorResponse(
  status: number,
  error: string,
  message: string,
  details?: unknown,
): Response {
  return Response.json(
    { error, message, ...(details ? { details } : {}) },
    { status },
  )
}

/** 400 Bad Request */
export function badRequest(message: string, details?: unknown): Response {
  return errorResponse(400, 'bad_request', message, details)
}

/** 401 Unauthorized */
export function unauthorized(message = 'No autenticado.'): Response {
  return errorResponse(401, 'unauthorized', message)
}

/** 404 Not Found */
export function notFound(message = 'Recurso no encontrado.'): Response {
  return errorResponse(404, 'not_found', message)
}

/** 429 Rate Limited */
export function rateLimited(message = 'Demasiados intentos. Intenta mas tarde.'): Response {
  return errorResponse(429, 'rate_limited', message)
}

/** 500 Internal Error */
export function internalError(message = 'Error interno del servidor.', context?: string): Response {
  if (context) console.error(`[${context}] Internal error:`, message)
  return errorResponse(500, 'internal_error', message)
}
