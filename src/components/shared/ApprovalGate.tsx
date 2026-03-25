'use client'

import { useState } from 'react'

type ApprovalGateProps = {
  sectionLabel: string
  onApprove: () => void
  onRevisionRequest: (feedback: string) => void
  isApproving: boolean
  onRegenerate?: () => void
  isRegenerating?: boolean
}

export function ApprovalGate({
  sectionLabel,
  onApprove,
  onRevisionRequest,
  isApproving,
  onRegenerate,
  isRegenerating,
}: ApprovalGateProps) {
  const [feedback, setFeedback] = useState('')
  const [showRevision, setShowRevision] = useState(false)

  return (
    <div className="mx-3 mb-2 rounded-lg border-l-4 border-emerald-600 bg-emerald-50 p-3 dark:border-emerald-400 dark:bg-emerald-900/20">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Listo para revisar</p>
      </div>
      <p className="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
        Mira el panel derecho. ¿Encaja? Aprueba. Si no, pide cambios abajo.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={onApprove}
          disabled={isApproving || isRegenerating}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isApproving ? 'Aprobando...' : 'Aprobar seccion'}
        </button>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating || isApproving}
            className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
          >
            {isRegenerating ? 'Regenerando...' : 'Regenerar con cambios'}
          </button>
        )}
        <button
          onClick={() => setShowRevision(!showRevision)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
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
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-gray-500"
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
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  )
}
