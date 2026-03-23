'use client'

import { KB_CATEGORY_LABELS, KB_CATEGORY_ICONS } from '@/types/knowledge'
import type { KnowledgeBaseEntry } from '@/types/knowledge'

type KnowledgeEntryCardProps = {
  entry: KnowledgeBaseEntry
  isSelected: boolean
  onClick: () => void
}

export function KnowledgeEntryCard({
  entry,
  isSelected,
  onClick,
}: KnowledgeEntryCardProps) {
  const date = new Date(entry.updated_at)
  const dateStr = date.toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <button
      onClick={onClick}
      className={`w-full border-b border-gray-50 px-4 py-3 text-left transition-colors dark:border-gray-800 ${
        isSelected
          ? 'bg-violet-50 dark:bg-violet-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {entry.is_pinned && (
              <svg className="h-3 w-3 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
            <h3 className={`truncate text-sm font-medium ${
              isSelected
                ? 'text-violet-700 dark:text-violet-300'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {entry.title}
            </h3>
          </div>
          {entry.summary && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {entry.summary}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {KB_CATEGORY_ICONS[entry.category]}
              {KB_CATEGORY_LABELS[entry.category]}
            </span>
            {entry.phase_number !== null && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                Phase {String(entry.phase_number).padStart(2, '0')}
              </span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {dateStr}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
