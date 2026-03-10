'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SECTION_LABELS, PHASE02_SECTIONS } from '@/lib/ai/prompts/phase-02'

type Phase02FinalGateProps = {
  projectId: string
}

export function Phase02FinalGate({ projectId }: Phase02FinalGateProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleApprove() {
    setIsApproving(true)

    const res = await fetch(`/api/projects/${projectId}/phases/2/approve`, {
      method: 'POST',
    })

    if (!res.ok) {
      setIsApproving(false)
      return
    }

    // Brief celebration then redirect
    setTimeout(() => {
      router.push(`/projects/${projectId}/phase/03`)
    }, 2000)
  }

  return (
    <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
        🏗️
      </div>
      <h2 className="text-lg font-bold text-gray-900">Phase 02 completada</h2>
      <p className="mt-1 text-sm text-gray-600">
        Has aprobado los {PHASE02_SECTIONS.length} documentos de arquitectura:
      </p>

      <div className="mx-auto mt-4 max-w-xs space-y-2">
        {PHASE02_SECTIONS.map((section) => (
          <div key={section} className="flex items-center gap-2 text-sm text-green-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {SECTION_LABELS[section]}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Al aprobar, Phase 03 (Environment Setup) se desbloqueara automaticamente.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-4 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          Aprobar Phase 02 y avanzar
        </button>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Estas seguro?</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
