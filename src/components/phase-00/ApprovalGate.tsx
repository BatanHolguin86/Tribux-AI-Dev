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
    <div className="mx-4 mb-4 rounded-lg border-2 border-violet-200 bg-violet-50 p-4">
      <p className="text-sm font-medium text-violet-800">
        El documento de {sectionLabel} esta listo para tu revision.
      </p>
      <p className="mt-1 text-xs text-violet-600">
        Revisa el panel derecho y cuando estes conforme, aprueba la seccion.
      </p>

      <button
        onClick={onApprove}
        disabled={isApproving}
        className="mt-3 w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
      >
        {isApproving ? 'Aprobando...' : `Aprobar ${sectionLabel}`}
      </button>

      <div className="mt-3">
        <p className="text-xs text-violet-600">O escribe si quieres cambiar algo:</p>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Agrega mas detalle sobre..."
            className="flex-1 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-violet-600 shadow-sm transition-colors hover:bg-violet-100 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
