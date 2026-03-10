'use client'

import { CREDITS_ERROR_CODE } from '@/lib/ai/chat-errors'

type ChatErrorBannerProps = {
  error: unknown
}

/** Parses API error response from useChat (fetch may put JSON body in error.message). */
function parseErrorPayload(error: unknown): { code?: string; message?: string } | null {
  try {
    const msg = error instanceof Error ? error.message : String(error)
    const parsed = JSON.parse(msg) as { code?: string; message?: string; error?: string }
    return {
      code: parsed.code ?? parsed.error,
      message: parsed.message,
    }
  } catch {
    return null
  }
}

function getDisplayMessage(error: unknown, payload: { code?: string; message?: string } | null): string {
  if (payload?.code === CREDITS_ERROR_CODE || payload?.message) {
    return payload.message ?? 'Créditos insuficientes.'
  }

  const msg = error instanceof Error ? error.message : String(error)
  if (msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('credits')) {
    return 'Tu saldo de créditos del proveedor de IA es insuficiente. Añade créditos para continuar.'
  }

  return 'No se pudo conectar con el asistente. Intenta de nuevo más tarde.'
}

export function ChatErrorBanner({ error }: ChatErrorBannerProps) {
  const payload = parseErrorPayload(error)
  const message = getDisplayMessage(error, payload)
  const isCredits = payload?.code === CREDITS_ERROR_CODE || message.includes('créditos')

  return (
    <div
      className={`mx-4 mb-3 rounded-lg border p-3 text-sm ${
        isCredits
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <span className="shrink-0" aria-hidden>
          {isCredits ? '⚠️' : '❌'}
        </span>
        <div className="flex-1">
          <p className="font-medium">{isCredits ? 'Créditos insuficientes' : 'Error de conexión'}</p>
          <p className="mt-0.5 opacity-90">{message}</p>
        </div>
      </div>
    </div>
  )
}
