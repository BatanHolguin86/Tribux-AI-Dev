'use client'

import { useFounderMode, founderLabel } from '@/hooks/useFounderMode'

type PhaseProgressHeaderProps = {
  title: string
  completedCount: number
  totalCount: number
  unitLabel?: string
  objective?: string
}

export function PhaseProgressHeader({
  title,
  completedCount,
  totalCount,
  unitLabel = 'categorías',
  objective,
}: PhaseProgressHeaderProps) {
  const { isFounder } = useFounderMode()
  const displayTitle = founderLabel(title, isFounder)
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const progressLine =
    totalCount === 0 && unitLabel === 'tasks'
      ? 'Las tasks del Kanban se generan desde los specs KIRO al aprobar Phase 03. Mientras tanto, usa las referencias de arriba.'
      : totalCount === 0
        ? 'Sin ítems en esta vista aún.'
        : `${completedCount} de ${totalCount} ${unitLabel} completadas`

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">{displayTitle}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{progressLine}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" role="progressbar" aria-valuenow={completedCount} aria-valuemax={totalCount}>
            <div
              className="h-1.5 rounded-full bg-brand-primary transition-all dark:bg-brand-teal"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{pct}%</span>
        </div>
      </div>
      {objective ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{objective}</p>
      ) : null}
    </div>
  )
}
