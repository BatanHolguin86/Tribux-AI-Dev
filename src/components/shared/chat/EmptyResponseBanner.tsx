'use client'

/**
 * Shows when a chat stream finishes without producing an assistant response.
 * This typically means the AI provider rejected the request (e.g., no credits)
 * but the error was swallowed by the streaming layer.
 */
export function EmptyResponseBanner() {
  return (
    <div
      className="mx-3 my-2 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F59E0B]/10 text-lg">
          💳
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-display font-semibold text-[#F59E0B]">
            No se recibio respuesta del asistente
          </p>
          <p className="mt-1 text-xs text-[#64748B] dark:text-gray-400">
            Esto puede ocurrir si los creditos de IA estan agotados o si hubo un problema temporal con el servicio.
          </p>
          <p className="mt-2 text-[10px] text-[#94A3B8]">
            Verifica tus creditos en console.anthropic.com o contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  )
}
