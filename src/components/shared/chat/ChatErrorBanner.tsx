'use client'

import { CREDITS_ERROR_CODE } from '@/lib/ai/chat-errors'

type ChatErrorBannerProps = {
  error: unknown
}

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
      className={`mx-3 my-2 rounded-lg border-l-4 p-3 text-sm ${
        isCredits
          ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/20'
          : 'border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <svg className={`mt-0.5 h-4 w-4 shrink-0 ${isCredits ? 'text-amber-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCredits ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' : 'M6 18L18 6M6 6l12 12'} />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">{isCredits ? 'Creditos insuficientes' : 'Error de conexion'}</p>
          <p className="mt-0.5 text-xs opacity-80">{message}</p>
        </div>
      </div>
    </div>
  )
}
