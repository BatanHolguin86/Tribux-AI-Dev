'use client'

import type { SectionStatus } from '@/types/conversation'

type ChecklistItem = {
  label: string
  description: string
}

type CategoryConfig = {
  title: string
  description: string
  icon: string
  items: ChecklistItem[]
}

type ChecklistCardProps = {
  config: CategoryConfig
  status: SectionStatus
  onToggle: () => void
  sectionKey: string
  itemStates: Record<number, boolean>
  onItemToggle: (sectionKey: string, itemIndex: number) => void
}

export function ChecklistCard({
  config,
  status,
  onToggle,
  sectionKey,
  itemStates,
  onItemToggle,
}: ChecklistCardProps) {
  const isCompleted = status === 'completed' || status === 'approved'

  return (
    <div
      className={`rounded-lg border-2 p-5 transition-colors ${
        isCompleted
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg">
            {config.icon}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">{config.title}</h3>
            <p className="text-xs text-gray-500">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Items — per-item persistence when category not marked complete */}
      <div className="mb-4 space-y-2">
        {config.items.map((item, i) => {
          const itemDone = isCompleted || itemStates[i] === true
          return (
            <button
              key={i}
              type="button"
              disabled={isCompleted}
              title={
                isCompleted
                  ? 'Desmarca la categoria para editar items por separado'
                  : 'Marcar item como hecho'
              }
              onClick={() => onItemToggle(sectionKey, i)}
              className={`flex w-full items-start gap-2 rounded-md p-1 text-left transition-colors ${
                isCompleted ? 'cursor-default' : 'hover:bg-gray-50 dark:hover:bg-gray-800/80'
              }`}
            >
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                  itemDone ? 'bg-green-500 text-white' : 'border border-gray-300 dark:border-gray-600'
                }`}
              >
                {itemDone && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    itemDone ? 'text-green-700 line-through dark:text-green-400' : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{item.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isCompleted
            ? 'border border-green-300 bg-white text-green-700 hover:bg-green-50'
            : 'bg-violet-600 text-white shadow-sm hover:bg-violet-700'
        }`}
      >
        {isCompleted ? 'Desmarcar categoria' : 'Marcar como completada'}
      </button>
    </div>
  )
}
