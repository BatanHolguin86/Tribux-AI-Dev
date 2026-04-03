'use client'

import { useState, useEffect } from 'react'
import type { ProjectWithProgress } from '@/types/project'
import { useFocusTrap } from '@/hooks/use-focus-trap'

type ArchiveConfirmDialogProps = {
  project: ProjectWithProgress | null
  onClose: () => void
  onConfirmed: (project: ProjectWithProgress, newStatus: string) => void
}

export function ArchiveConfirmDialog({ project, onClose, onConfirmed }: ArchiveConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const trapRef = useFocusTrap<HTMLDivElement>(!!project)

  useEffect(() => {
    if (!project) return
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [project, onClose])

  if (!project) return null

  const isArchived = project.status === 'archived'
  const action = isArchived ? 'restaurar' : 'archivar'
  const newStatus = isArchived ? 'active' : 'archived'

  async function handleConfirm() {
    setLoading(true)
    const res = await fetch(`/api/projects/${project!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    setLoading(false)

    if (!res.ok) return

    onConfirmed(project!, newStatus)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div ref={trapRef} role="dialog" aria-modal="true" className="relative z-10 w-full max-w-sm rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl dark:shadow-black/30">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isArchived ? 'Restaurar' : 'Archivar'} proyecto
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Estas seguro que quieres {action}{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">{project.name}</span>?
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 ${
              isArchived
                ? 'bg-[#0F2B46] hover:bg-[#0A1F33]'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Procesando...' : isArchived ? 'Restaurar' : 'Archivar'}
          </button>
        </div>
      </div>
    </div>
  )
}
