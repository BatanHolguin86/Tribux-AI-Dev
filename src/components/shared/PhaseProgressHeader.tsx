'use client'

/**
 * Shared progress header for phases 03–07.
 * Uses design tokens: primary (violet), muted (gray) per docs/02-architecture/design-tokens.md.
 */
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
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {completedCount} de {totalCount} {unitLabel} completadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-2 rounded-full bg-violet-600 transition-all dark:bg-violet-500"
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
