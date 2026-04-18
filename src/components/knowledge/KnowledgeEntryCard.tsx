'use client'

import { KB_CATEGORY_LABELS, KB_CATEGORY_ICONS } from '@/types/knowledge'
import type { KnowledgeBaseEntry } from '@/types/knowledge'

type KnowledgeEntryCardProps = {
  entry: KnowledgeBaseEntry
  isSelected: boolean
  onClick: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  documentos: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  decisiones: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
  guias: 'bg-brand-teal/10 text-brand-teal',
  artefactos: 'bg-[#EC4899]/10 text-[#EC4899]',
  notas: 'bg-brand-amber/10 text-brand-amber',
}

const PHASE_LABELS: Record<number, string> = {
  0: 'Discovery',
  1: 'Specs',
  2: 'Arquitectura',
  3: 'Infra',
  4: 'Desarrollo',
  5: 'Testing',
  6: 'Lanzamiento',
  7: 'Iteracion',
}

/** Humanize snake_case titles */
function humanizeTitle(title: string): string {
  // Remove leading doc type prefixes
  const cleaned = title
    .replace(/^(requirements|design|tasks)\s*—\s*/i, '')
    .replace(/_/g, ' ')

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export function KnowledgeEntryCard({
  entry,
  isSelected,
  onClick,
}: KnowledgeEntryCardProps) {
  const date = new Date(entry.updated_at)
  const dateStr = date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  const catColor = CATEGORY_COLORS[entry.category] ?? 'bg-gray-100 text-gray-500'
  const phaseLabel = entry.phase_number !== null ? PHASE_LABELS[entry.phase_number] : null

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3.5 text-left transition-all ${
        isSelected
          ? 'border-l-3 border-l-[#0EA5A3] bg-brand-teal/5'
          : 'border-l-3 border-l-transparent hover:bg-[#F8FAFC] dark:hover:bg-white/5'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${catColor}`}>
          {KB_CATEGORY_ICONS[entry.category]}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {entry.is_pinned && (
              <span className="text-brand-amber text-xs">📌</span>
            )}
            <h3 className={`truncate text-sm font-medium ${
              isSelected
                ? 'text-brand-primary dark:text-brand-teal'
                : 'text-brand-primary dark:text-gray-100'
            }`}>
              {humanizeTitle(entry.title)}
            </h3>
          </div>

          {entry.summary && (
            <p className="mt-0.5 line-clamp-1 text-xs text-brand-muted">
              {entry.summary}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${catColor}`}>
              {KB_CATEGORY_LABELS[entry.category]}
            </span>
            {phaseLabel && (
              <span className="text-[10px] text-brand-muted">
                {phaseLabel}
              </span>
            )}
            <span className="text-[10px] text-brand-muted">{dateStr}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
