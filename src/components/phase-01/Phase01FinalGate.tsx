'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type FeatureSummary = {
  name: string
  status: string
}

type Phase01FinalGateProps = {
  projectId: string
  features: FeatureSummary[]
}

export function Phase01FinalGate({ projectId, features }: Phase01FinalGateProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  async function handleApprove() {
    setIsApproving(true)
    setError('')

    const res = await fetch(`/api/projects/${projectId}/phases/1/approve`, {
      method: 'POST',
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Error al aprobar')
      setIsApproving(false)
      return
    }

    setTimeout(() => {
      router.push(`/projects/${projectId}/phase/02`)
    }, 2000)
  }

  return (
    <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-800/30">
        🎉
      </div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Phase 01 completada</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Todos los features tienen sus specs KIRO completos:
      </p>

      <div className="mx-auto mt-4 max-w-xs space-y-2">
        {features.map((f) => (
          <div key={f.name} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {f.name}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Al aprobar, Phase 02 (Architecture & Design) se desbloqueara automaticamente.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-4 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          Aprobar Phase 01 y avanzar
        </button>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Estas seguro?</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
            >
              {isApproving ? 'Aprobando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
