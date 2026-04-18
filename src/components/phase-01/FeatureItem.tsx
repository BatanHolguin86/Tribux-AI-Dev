'use client'

import type { KiroDocumentType } from '@/types/feature'

type FeatureItemProps = {
  name: string
  status: string
  documents: Record<KiroDocumentType, { status: string } | null>
  isActive: boolean
  onClick: () => void
}

const DOC_STEPS: { key: KiroDocumentType; label: string }[] = [
  { key: 'requirements', label: 'R' },
  { key: 'design', label: 'D' },
  { key: 'tasks', label: 'T' },
]

export function FeatureItem({ name, status, documents, onClick }: FeatureItemProps) {
  const docsApproved = DOC_STEPS.filter((s) => documents[s.key]?.status === 'approved').length
  const isComplete = status === 'approved' || status === 'spec_complete'
  const isInProgress = status === 'in_progress'

  return (
    <button
      onClick={onClick}
      className={`group flex w-full flex-col rounded-xl border p-4 text-left transition-all hover:shadow-md ${
        isComplete
          ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/10'
          : isInProgress
            ? 'border-brand-teal/30 bg-white hover:border-brand-teal dark:border-brand-primary/60 dark:bg-gray-900 dark:hover:border-[#0A1F33]'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
      }`}
    >
      {/* Feature name */}
      <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
        {name}
      </h3>

      {/* R D T step indicators + status */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {DOC_STEPS.map((step, i) => {
            const docStatus = documents[step.key]?.status
            const approved = docStatus === 'approved'
            const draft = docStatus === 'draft'
            return (
              <div key={step.key} className="flex items-center gap-1">
                {i > 0 && <span className="text-[10px] text-gray-300 dark:text-gray-600">›</span>}
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                    approved
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : draft
                        ? 'bg-brand-surface text-brand-primary dark:bg-brand-primary/30 dark:text-brand-teal'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  }`}
                >
                  {approved ? (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.label
                  )}
                </span>
              </div>
            )
          })}
        </div>

        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
            isComplete
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : isInProgress
                ? 'bg-brand-surface text-brand-primary dark:bg-brand-primary/30 dark:text-brand-teal'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {isComplete ? 'Completo' : isInProgress ? 'En progreso' : 'Pendiente'}
        </span>
      </div>

      {/* CTA */}
      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-primary opacity-0 transition-opacity group-hover:opacity-100 dark:text-brand-teal">
        {isComplete ? 'Ver spec' : 'Trabajar en spec'}
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
