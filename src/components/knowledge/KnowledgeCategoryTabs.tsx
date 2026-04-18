'use client'

import { KB_CATEGORIES, KB_CATEGORY_LABELS, KB_CATEGORY_ICONS } from '@/types/knowledge'
import type { KBCategory } from '@/types/knowledge'

type KnowledgeCategoryTabsProps = {
  active: KBCategory | null
  counts: Record<string, number>
  onChange: (category: KBCategory | null) => void
}

const CATEGORY_ACTIVE_COLORS: Record<string, string> = {
  documentos: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  decisiones: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
  guias: 'bg-brand-teal/10 text-brand-teal',
  artefactos: 'bg-[#EC4899]/10 text-[#EC4899]',
  notas: 'bg-brand-amber/10 text-brand-amber',
}

export function KnowledgeCategoryTabs({
  active,
  counts,
  onChange,
}: KnowledgeCategoryTabsProps) {
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
          active === null
            ? 'bg-brand-primary text-white shadow-sm'
            : 'text-brand-muted hover:bg-[#F1F5F9] dark:text-brand-muted dark:hover:bg-white/5'
        }`}
      >
        Todos
        <span className="ml-1.5 text-[10px] opacity-70">{totalAll}</span>
      </button>

      {KB_CATEGORIES.map((cat) => {
        const count = counts[cat] ?? 0
        const activeColor = CATEGORY_ACTIVE_COLORS[cat] ?? 'bg-gray-100 text-gray-600'
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              active === cat
                ? `${activeColor} shadow-sm`
                : 'text-brand-muted hover:bg-[#F1F5F9] dark:text-brand-muted dark:hover:bg-white/5'
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
