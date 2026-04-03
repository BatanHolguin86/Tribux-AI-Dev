'use client'

import type { DashboardSummary } from '@/types/project'

type DashboardHeaderProps = {
  summary: DashboardSummary
  onCreateProject?: () => void
}

export function DashboardHeader({ summary, onCreateProject }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tus proyectos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {summary.total_active === 0
            ? 'Crea tu primer proyecto para comenzar'
            : `${summary.total_active} proyecto${summary.total_active !== 1 ? 's' : ''} activo${summary.total_active !== 1 ? 's' : ''}`}
          {summary.phases_completed_this_week > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
              +{summary.phases_completed_this_week} fase{summary.phases_completed_this_week !== 1 ? 's' : ''} esta semana
            </span>
          )}
        </p>
      </div>
      {onCreateProject && (
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0F2B46] to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo proyecto
        </button>
      )}
    </div>
  )
}
