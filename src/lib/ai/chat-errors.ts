/**
 * Server-side chat error handling.
 * Centralizes detection of provider errors (e.g. Anthropic credits) and response formatting.
 */

export const CREDITS_ERROR_CODE = 'credits_insufficient' as const

export const CREDITS_USER_MESSAGE =
  'Tu saldo de créditos del proveedor de IA es insuficiente. Por favor, añade créditos en la consola del proveedor (p. ej. console.anthropic.com) para continuar.'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return String(error)
}

function getErrorResponseBody(error: unknown): string | undefined {
  const err = error as { responseBody?: string; cause?: unknown }
  if (typeof err?.responseBody === 'string') return err.responseBody
  const cause = err?.cause as { responseBody?: string } | undefined
  return typeof cause?.responseBody === 'string' ? cause.responseBody : undefined
}

/** Detects if the error is due to insufficient credits (Anthropic or similar providers). */
export function isCreditsError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase()
  const body = getErrorResponseBody(error)?.toLowerCase() ?? ''
  return (
    msg.includes('credit balance') ||
    msg.includes('credits') ||
    msg.includes('insufficient') ||
    body.includes('credit balance') ||
    body.includes('credits')
  )
}

/** Returns status and JSON body for chat API error responses. */
export function formatChatErrorResponse(error: unknown): {
  status: number
  body: { error: string; code?: string; message: string }
} {
  if (isCreditsError(error)) {
    return {
      status: 402,
      body: {
        error: CREDITS_ERROR_CODE,
        code: CREDITS_ERROR_CODE,
        message: CREDITS_USER_MESSAGE,
      },
    }
  }

  const message = error instanceof Error ? error.message : 'Error desconocido'
  return {
    status: 500,
    body: {
      error: message,
      message: 'No se pudo conectar con el asistente. Intenta de nuevo más tarde.',
    },
  }
}
