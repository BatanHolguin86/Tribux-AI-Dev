'use client'

import type { KnowledgeBaseEntry } from '@/types/knowledge'
import { KnowledgeEntryCard } from './KnowledgeEntryCard'

type KnowledgeEntryListProps = {
  entries: KnowledgeBaseEntry[]
  selectedId: string | null
  loading: boolean
  onSelect: (id: string) => void
}

export function KnowledgeEntryList({
  entries,
  selectedId,
  loading,
  onSelect,
}: KnowledgeEntryListProps) {
  if (loading && entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0EA5A3]/30 border-t-[#0F2B46]" />
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
      {entries.map((entry) => (
        <KnowledgeEntryCard
          key={entry.id}
          entry={entry}
          isSelected={entry.id === selectedId}
          onClick={() => onSelect(entry.id)}
        />
      ))}
    </div>
  )
}
