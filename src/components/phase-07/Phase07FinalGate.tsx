'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PHASE07_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-07'

type Phase07FinalGateProps = {
  projectId: string
}

export function Phase07FinalGate({ projectId }: Phase07FinalGateProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [cycleApproved, setCycleApproved] = useState(false)
  const [startingCycle, setStartingCycle] = useState(false)

  async function handleApprove() {
    setIsApproving(true)

    const res = await fetch(`/api/projects/${projectId}/phases/7/approve`, {
      method: 'POST',
    })

    if (!res.ok) {
      setIsApproving(false)
      toast.error('Error al completar el ciclo')
      return
    }

    toast.success('Ciclo IA DLC completado!')
    setCycleApproved(true)
  }

  async function handleNewCycle() {
    setStartingCycle(true)

    const res = await fetch(`/api/projects/${projectId}/new-cycle`, {
      method: 'POST',
    })

    if (!res.ok) {
      setStartingCycle(false)
      toast.error('Error al iniciar nuevo ciclo')
      return
    }

    toast.success('Nuevo ciclo iniciado!')
    router.push(`/projects/${projectId}/phase/00`)
  }

  return (
    <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-800/30">
        🎉
      </div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ciclo IA DLC completado!</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Has completado las {PHASE07_SECTIONS.length} categorias de Iteration & Growth:
      </p>

      <div className="mx-auto mt-4 max-w-xs space-y-2">
        {PHASE07_SECTIONS.map((section) => (
          <div key={section} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {SECTION_LABELS[section]}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Al aprobar, el ciclo IA DLC se marca como completado. Puedes iniciar un nuevo ciclo desde el dashboard.
      </p>

      {cycleApproved ? (
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => router.push(`/projects/${projectId}/dashboard`)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Ir al dashboard
          </button>
          <button
            onClick={handleNewCycle}
            disabled={startingCycle}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
          >
            {startingCycle ? 'Iniciando...' : 'Iniciar nuevo ciclo'}
          </button>
        </div>
      ) : !showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-4 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          Completar ciclo IA DLC
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
