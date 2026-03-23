'use client'

import type { KiroDocumentType } from '@/types/feature'

type FeatureItemProps = {
  name: string
  status: string
  documents: Record<KiroDocumentType, { status: string } | null>
  isActive: boolean
  onClick: () => void
}

const DOC_INDICATORS: KiroDocumentType[] = ['requirements', 'design', 'tasks']
const DOC_LABELS: Record<KiroDocumentType, string> = { requirements: 'R', design: 'D', tasks: 'T' }
const DOC_FULL_LABELS: Record<KiroDocumentType, string> = {
  requirements: 'Requisitos',
  design: 'Diseño',
  tasks: 'Tasks',
}

function DocIndicator({ label, fullLabel, status }: { label: string; fullLabel: string; status: string | null }) {
  const color = status === 'approved'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : status === 'draft'
      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
      : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'

  return (
    <div className="flex items-center gap-1.5">
      <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${color}`}>
        {label}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{fullLabel}</span>
      {status === 'approved' && (
        <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  )
}

export function FeatureItem({ name, status, documents, isActive, onClick }: FeatureItemProps) {
  const docsApproved = DOC_INDICATORS.filter((dt) => documents[dt]?.status === 'approved').length
  const isComplete = status === 'approved' || status === 'spec_complete'
  const isInProgress = status === 'in_progress'

  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-md ${
        isComplete
          ? 'border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-950/20'
          : isInProgress
            ? 'border-violet-200 bg-white hover:border-violet-300 dark:border-violet-800 dark:bg-gray-900 dark:hover:border-violet-700'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-5 text-gray-900 dark:text-gray-100">{name}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isComplete
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : isInProgress
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {isComplete ? 'Completado' : isInProgress ? 'En progreso' : 'Pendiente'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          {DOC_INDICATORS.map((dt) => (
            <DocIndicator
              key={dt}
              label={DOC_LABELS[dt]}
              fullLabel={DOC_FULL_LABELS[dt]}
              status={documents[dt]?.status ?? null}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{docsApproved}/3</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">docs</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400">
        {isComplete ? 'Ver spec' : 'Trabajar en spec'}
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
