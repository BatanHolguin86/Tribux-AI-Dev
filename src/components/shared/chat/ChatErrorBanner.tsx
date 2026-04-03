'use client'

import { CREDITS_ERROR_CODE } from '@/lib/ai/chat-errors'
import { toFriendlyMessage } from '@/lib/errors/friendly-messages'

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
    return payload.message ?? 'Creditos insuficientes. Contacta al administrador.'
  }

  const msg = error instanceof Error ? error.message : String(error)
  if (msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('credits') || msg.toLowerCase().includes('credito')) {
    return 'Creditos de IA insuficientes. Contacta al administrador para recargar.'
  }

  return toFriendlyMessage(error)
}

function isCreditsError(error: unknown, payload: { code?: string; message?: string } | null, message: string): boolean {
  if (payload?.code === CREDITS_ERROR_CODE) return true
  const raw = error instanceof Error ? error.message : String(error)
  if (raw.toLowerCase().includes('credit') || raw.toLowerCase().includes('credito')) return true
  if (message.toLowerCase().includes('credito') || message.toLowerCase().includes('insuficiente')) return true
  return false
}

export function ChatErrorBanner({ error }: ChatErrorBannerProps) {
  const payload = parseErrorPayload(error)
  const message = getDisplayMessage(error, payload)
  const isCredits = isCreditsError(error, payload, message)

  return (
    <div
      className={`mx-3 my-2 rounded-xl p-4 text-sm ${
        isCredits
          ? 'border border-[#F59E0B]/30 bg-[#F59E0B]/5'
          : 'border border-[#EF4444]/30 bg-[#EF4444]/5'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg ${
          isCredits ? 'bg-[#F59E0B]/10' : 'bg-[#EF4444]/10'
        }`}>
          {isCredits ? '💳' : '⚠️'}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-display font-semibold ${
            isCredits ? 'text-[#F59E0B]' : 'text-[#EF4444]'
          }`}>
            {isCredits ? 'Creditos insuficientes' : 'No se pudo conectar'}
          </p>
          <p className="mt-1 text-xs text-[#64748B] dark:text-gray-400">{message}</p>
          {isCredits && (
            <p className="mt-2 text-[10px] text-[#94A3B8]">
              El administrador puede recargar creditos en console.anthropic.com
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
