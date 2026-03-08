'use client'

import { useState } from 'react'
import type { ProjectWithProgress } from '@/types/project'

type ArchiveConfirmDialogProps = {
  project: ProjectWithProgress | null
  onClose: () => void
  onConfirmed: (project: ProjectWithProgress, newStatus: string) => void
}

export function ArchiveConfirmDialog({ project, onClose, onConfirmed }: ArchiveConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

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
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          {isArchived ? 'Restaurar' : 'Archivar'} proyecto
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Estas seguro que quieres {action}{' '}
          <span className="font-medium text-gray-900">{project.name}</span>?
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 ${
              isArchived
                ? 'bg-violet-600 hover:bg-violet-700'
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
