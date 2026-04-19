'use client'

import { useMemo } from 'react'
import type { KnowledgeBaseEntry } from '@/types/knowledge'
import { KnowledgeEntryCard } from './KnowledgeEntryCard'

type KnowledgeEntryListProps = {
  entries: KnowledgeBaseEntry[]
  selectedId: string | null
  loading: boolean
  onSelect: (id: string) => void
}

const PHASE_META: Record<number, { label: string; icon: string }> = {
  0: { label: 'Phase 00 — Discovery', icon: '🔍' },
  1: { label: 'Phase 01 — Requirements & Spec', icon: '📋' },
  2: { label: 'Phase 02 — Architecture', icon: '🏗️' },
  3: { label: 'Phase 03 — Environment Setup', icon: '⚙️' },
  4: { label: 'Phase 04 — Development', icon: '💻' },
  5: { label: 'Phase 05 — Testing & QA', icon: '🧪' },
  6: { label: 'Phase 06 — Launch', icon: '🚀' },
  7: { label: 'Phase 07 — Iteration', icon: '🔄' },
}

function groupByPhase(entries: KnowledgeBaseEntry[]) {
  const groups = new Map<number | null, KnowledgeBaseEntry[]>()

  for (const entry of entries) {
    const key = entry.phase_number
    const list = groups.get(key) ?? []
    list.push(entry)
    groups.set(key, list)
  }

  // Sort: phases 0-7 first, then null (general) at the end
  const sorted = [...groups.entries()].sort(([a], [b]) => {
    if (a === null) return 1
    if (b === null) return -1
    return a - b
  })

  return sorted
}

export function KnowledgeEntryList({
  entries,
  selectedId,
  loading,
  onSelect,
}: KnowledgeEntryListProps) {
  const grouped = useMemo(() => groupByPhase(entries), [entries])

  if (loading && entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-teal/30 border-t-[#0F2B46]" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No se encontraron entradas
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {grouped.map(([phase, items]) => {
        const meta = phase !== null ? PHASE_META[phase] : null
        return (
          <div key={phase ?? 'general'}>
            {/* Phase header */}
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-[#F8FAFC] px-4 py-2 dark:border-gray-800 dark:bg-gray-900/95">
              <span className="text-xs">{meta?.icon ?? '📁'}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                {meta?.label ?? 'General'}
              </span>
              <span className="ml-auto text-[10px] text-brand-muted">
                {items.length}
              </span>
            </div>
            {/* Entries in this phase */}
            {items.map((entry) => (
              <KnowledgeEntryCard
                key={entry.id}
                entry={entry}
                isSelected={entry.id === selectedId}
                onClick={() => onSelect(entry.id)}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
