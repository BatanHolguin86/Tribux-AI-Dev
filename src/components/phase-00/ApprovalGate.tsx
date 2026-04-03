'use client'

import { useState } from 'react'

type ApprovalGateProps = {
  sectionLabel: string
  onApprove: () => void
  onRevisionRequest: (feedback: string) => void
  isApproving: boolean
}

export function ApprovalGate({
  sectionLabel,
  onApprove,
  onRevisionRequest,
  isApproving,
}: ApprovalGateProps) {
  const [feedback, setFeedback] = useState('')

  return (
    <div className="mx-4 mb-4 rounded-lg border-2 border-[#0EA5A3]/30 bg-[#E8F4F8] p-4 dark:border-[#0F2B46] dark:bg-[#0F2B46]/20">
      <p className="text-sm font-medium text-[#0F2B46] dark:text-[#0EA5A3]/30">
        El documento de {sectionLabel} esta listo para tu revision.
      </p>
      <p className="mt-1 text-xs text-[#0F2B46] dark:text-[#0EA5A3]">
        Revisa el panel derecho y cuando estes conforme, aprueba la seccion.
      </p>

      <button
        onClick={onApprove}
        disabled={isApproving}
        className="mt-3 w-full rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33] disabled:opacity-50"
      >
        {isApproving ? 'Aprobando...' : `Aprobar ${sectionLabel}`}
      </button>

      <div className="mt-3">
        <p className="text-xs text-[#0F2B46] dark:text-[#0EA5A3]">O escribe si quieres cambiar algo:</p>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Agrega mas detalle sobre..."
            className="flex-1 rounded-lg border border-[#0EA5A3]/30 bg-white px-3 py-1.5 text-sm focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3] dark:border-[#0A1F33] dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && feedback.trim()) {
                onRevisionRequest(feedback)
                setFeedback('')
              }
            }}
          />
          <button
            onClick={() => {
              if (feedback.trim()) {
                onRevisionRequest(feedback)
                setFeedback('')
              }
            }}
            disabled={!feedback.trim()}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-[#0F2B46] shadow-sm transition-colors hover:bg-[#E8F4F8] disabled:opacity-50 dark:bg-gray-800 dark:text-[#0EA5A3] dark:hover:bg-gray-700"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
