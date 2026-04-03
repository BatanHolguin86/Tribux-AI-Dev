'use client'

import { useState } from 'react'
import type { SectionStatus } from '@/types/conversation'
import type { ActionDefinition, ActionExecution } from '@/types/action'

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

type AutomatedChecklistCardProps = {
  config: CategoryConfig
  status: SectionStatus
  onToggle: () => void
  sectionKey: string
  itemStates: Record<number, boolean>
  onItemToggle: (sectionKey: string, itemIndex: number) => void
  action?: ActionDefinition
  executions?: ActionExecution[]
  onActionExecute?: (actionName: string) => void
  executingAction?: string | null
}

export function AutomatedChecklistCard({
  config,
  status,
  onToggle,
  sectionKey,
  itemStates,
  onItemToggle,
  action,
  executions = [],
  onActionExecute,
  executingAction,
}: AutomatedChecklistCardProps) {
  const [showResult, setShowResult] = useState(false)
  const isCompleted = status === 'completed' || status === 'approved'
  const isExecuting = executingAction === action?.actionName
  const lastExecution = executions.find(
    (e) => e.action_name === action?.actionName,
  )
  const lastSuccess = lastExecution?.status === 'success'
  const lastFailed = lastExecution?.status === 'failed'

  return (
    <div
      className={`rounded-lg border-2 p-5 transition-colors ${
        isCompleted
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-lg">
            {config.icon}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{config.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
          </div>
        </div>

        {/* Action button */}
        {action && onActionExecute && !isCompleted && (
          <button
            onClick={() => onActionExecute(action.actionName)}
            disabled={isExecuting}
            title={action.description}
            className="flex items-center gap-1.5 rounded-lg bg-[#0F2B46] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33] disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Ejecutando...
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                {action.label}
              </>
            )}
          </button>
        )}
      </div>

      {/* Last execution status */}
      {lastExecution && (
        <div className="mb-3">
          {lastSuccess && (
            <button
              onClick={() => setShowResult(!showResult)}
              className="flex w-full items-center gap-1.5 rounded-md bg-green-50 dark:bg-green-900/20 px-3 py-1.5 text-xs text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {lastExecution.result_summary ?? 'Ejecutado exitosamente'}
              <svg className={`ml-auto h-3 w-3 transition-transform ${showResult ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {lastFailed && (
            <div className="flex items-center gap-1.5 rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs text-red-700 dark:text-red-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {lastExecution.error_message ?? 'Error en la ejecucion'}
            </div>
          )}
          {showResult && lastExecution.result_data && (() => {
            const data = lastExecution.result_data as Record<string, unknown>
            const commitUrl = typeof data.commitUrl === 'string' ? data.commitUrl : null
            const rowCount = data.rowCount !== undefined ? String(data.rowCount) : null
            return (
              <div className="mt-2 rounded-md bg-gray-50 dark:bg-gray-800 p-3 text-xs text-gray-600 dark:text-gray-400">
                {commitUrl && (
                  <a
                    href={commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0F2B46] dark:text-[#0EA5A3] underline"
                  >
                    Ver commit en GitHub
                  </a>
                )}
                {rowCount !== null && <p>Filas afectadas: {rowCount}</p>}
              </div>
            )
          })()}
        </div>
      )}

      {/* Items */}
      <div className="mb-4 space-y-2">
        {config.items.map((item, i) => {
          const itemDone = isCompleted || itemStates[i] === true
          return (
            <button
              key={i}
              type="button"
              disabled={isCompleted}
              title={isCompleted ? 'Desmarca la categoria para editar items' : 'Marcar item como hecho'}
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
            ? 'border border-green-300 dark:border-green-700 bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
            : 'bg-[#0F2B46] text-white shadow-sm hover:bg-[#0A1F33]'
        }`}
      >
        {isCompleted ? 'Desmarcar categoria' : 'Marcar como completada'}
      </button>
    </div>
  )
}
