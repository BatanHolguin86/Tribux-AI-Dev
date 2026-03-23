'use client'

import { KB_CATEGORIES, KB_CATEGORY_LABELS, KB_CATEGORY_ICONS } from '@/types/knowledge'
import type { KBCategory } from '@/types/knowledge'

type KnowledgeCategoryTabsProps = {
  active: KBCategory | null
  counts: Record<string, number>
  onChange: (category: KBCategory | null) => void
}

export function KnowledgeCategoryTabs({
  active,
  counts,
  onChange,
}: KnowledgeCategoryTabsProps) {
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          active === null
            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
        }`}
      >
        Todos
        <span className="ml-1.5 text-[10px] opacity-60">{totalAll}</span>
      </button>

      {KB_CATEGORIES.map((cat) => {
        const count = counts[cat] ?? 0
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              active === cat
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-[11px]">{KB_CATEGORY_ICONS[cat]}</span>
            {KB_CATEGORY_LABELS[cat]}
            <span className="text-[10px] opacity-60">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
