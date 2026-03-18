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

function DocIndicator({ label, status }: { label: string; status: string | null }) {
  const color = status === 'approved'
    ? 'bg-green-100 text-green-700'
    : status === 'draft'
      ? 'bg-violet-100 text-violet-700'
      : 'bg-gray-100 text-gray-400'

  return (
    <span className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${color}`}>
      {label}
    </span>
  )
}

export function FeatureItem({ name, status, documents, isActive, onClick }: FeatureItemProps) {
  const statusIcon = status === 'approved' || status === 'spec_complete' ? '✓' : status === 'in_progress' ? '▶' : '○'
  const statusColor =
    status === 'approved' || status === 'spec_complete'
      ? 'text-green-600'
      : status === 'in_progress'
        ? 'text-violet-600'
        : 'text-gray-400'

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
        isActive ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className={`mt-1 text-xs font-semibold ${statusColor}`}>{statusIcon}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-2 font-medium leading-5">{name}</span>
        <div className="mt-1 flex gap-1.5">
        {DOC_INDICATORS.map((dt) => (
          <DocIndicator key={dt} label={DOC_LABELS[dt]} status={documents[dt]?.status ?? null} />
        ))}
        </div>
      </div>
    </button>
  )
}
