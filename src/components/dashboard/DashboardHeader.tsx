'use client'

import type { DashboardSummary } from '@/types/project'

type DashboardHeaderProps = {
  summary: DashboardSummary
  onCreateProject?: () => void
}

export function DashboardHeader({ summary, onCreateProject }: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tus proyectos</h1>
        <p className="mt-1 text-sm text-gray-500">
          {summary.total_active} proyecto{summary.total_active !== 1 ? 's' : ''} activo{summary.total_active !== 1 ? 's' : ''}
          {summary.phases_completed_this_week > 0 && (
            <> · {summary.phases_completed_this_week} fase{summary.phases_completed_this_week !== 1 ? 's' : ''} completada{summary.phases_completed_this_week !== 1 ? 's' : ''} esta semana</>
          )}
        </p>
      </div>
      {onCreateProject && (
        <button
          onClick={onCreateProject}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          Nuevo proyecto
        </button>
      )}
    </div>
  )
}
