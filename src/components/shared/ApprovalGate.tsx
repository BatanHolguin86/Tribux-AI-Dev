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
  const [showRevision, setShowRevision] = useState(false)

  return (
    <div className="mx-4 mb-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            Documento listo para revision
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Revisa {sectionLabel} en el panel derecho y aprueba cuando estes conforme.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onApprove}
          disabled={isApproving}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isApproving ? 'Aprobando...' : 'Aprobar seccion'}
        </button>
        <button
          onClick={() => setShowRevision(!showRevision)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
        >
          Pedir cambios
        </button>
      </div>

      {showRevision && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe los cambios que necesitas..."
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && feedback.trim()) {
                onRevisionRequest(feedback)
                setFeedback('')
                setShowRevision(false)
              }
            }}
          />
          <button
            onClick={() => {
              if (feedback.trim()) {
                onRevisionRequest(feedback)
                setFeedback('')
                setShowRevision(false)
              }
            }}
            disabled={!feedback.trim()}
            className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  )
}
