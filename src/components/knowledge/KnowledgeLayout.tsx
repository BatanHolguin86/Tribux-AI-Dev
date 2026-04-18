'use client'

import { useState, useCallback, useEffect } from 'react'
import type { KnowledgeBaseEntry, KBCategory } from '@/types/knowledge'
import { KnowledgeCategoryTabs } from './KnowledgeCategoryTabs'
import { KnowledgeSearch } from './KnowledgeSearch'
import { KnowledgeEntryList } from './KnowledgeEntryList'
import { KnowledgeEntryDetail } from './KnowledgeEntryDetail'
import { KnowledgeNoteEditor } from './KnowledgeNoteEditor'
import { KnowledgeEmptyState } from './KnowledgeEmptyState'
import { ExportButton } from './ExportButton'

type KnowledgeLayoutProps = {
  projectId: string
  initialEntries: KnowledgeBaseEntry[]
  initialTotal: number
  categoryCounts: Record<string, number>
}

export function KnowledgeLayout({
  projectId,
  initialEntries,
  initialTotal,
  categoryCounts: initialCounts,
}: KnowledgeLayoutProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [total, setTotal] = useState(initialTotal)
  const [categoryCounts, setCategoryCounts] = useState(initialCounts)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialEntries[0]?.id ?? null
  )
  const [activeCategory, setActiveCategory] = useState<KBCategory | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null

  const fetchEntries = useCallback(
    async (cat: KBCategory | null, q: string, p: number) => {
      setLoading(true)
      const params = new URLSearchParams()
      if (cat) params.set('category', cat)
      if (q) params.set('q', q)
      params.set('page', String(p))

      const res = await fetch(
        `/api/projects/${projectId}/knowledge?${params.toString()}`
      )
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries)
        setTotal(data.total)
        if (p === 1 && data.entries.length > 0) {
          setSelectedId(data.entries[0].id)
        } else if (data.entries.length === 0) {
          setSelectedId(null)
        }
      }
      setLoading(false)
    },
    [projectId]
  )

  const refreshCounts = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/knowledge?page=1`)
    if (!res.ok) return
    // Fetch counts per category
    const counts: Record<string, number> = {}
    for (const cat of ['documentos', 'decisiones', 'guias', 'artefactos', 'notas']) {
      const r = await fetch(
        `/api/projects/${projectId}/knowledge?category=${cat}&page=1`
      )
      if (r.ok) {
        const d = await r.json()
        counts[cat] = d.total
      }
    }
    setCategoryCounts(counts)
  }, [projectId])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchEntries(activeCategory, searchQuery, page)
    })
  }, [activeCategory, searchQuery, page, fetchEntries])

  const handleCategoryChange = useCallback((cat: KBCategory | null) => {
    setActiveCategory(cat)
    setPage(1)
  }, [])

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    setPage(1)
  }, [])

  const handleNoteCreated = useCallback(() => {
    setShowEditor(false)
    setPage(1)
    fetchEntries(activeCategory, searchQuery, 1)
    refreshCounts()
  }, [activeCategory, searchQuery, fetchEntries, refreshCounts])

  const handleEntryDeleted = useCallback(() => {
    setSelectedId(null)
    fetchEntries(activeCategory, searchQuery, page)
    refreshCounts()
  }, [activeCategory, searchQuery, page, fetchEntries, refreshCounts])

  const handleEntryUpdated = useCallback(
    (updated: KnowledgeBaseEntry) => {
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    },
    []
  )

  const handleSeeded = useCallback(() => {
    fetchEntries(null, '', 1)
    refreshCounts()
    setActiveCategory(null)
    setSearchQuery('')
  }, [fetchEntries, refreshCounts])

  const totalAll = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
  const hasNoEntries = totalAll === 0 && !searchQuery && !activeCategory

  if (hasNoEntries) {
    return <KnowledgeEmptyState projectId={projectId} onSeeded={handleSeeded} />
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="flex h-[var(--content-height)] flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">
            Base de Conocimiento
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {totalAll} entrada{totalAll !== 1 ? 's' : ''} en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton projectId={projectId} />
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-navy"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva nota
          </button>
        </div>
      </div>

      {/* Search + Category tabs */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        <KnowledgeSearch value={searchQuery} onChange={handleSearch} />
        <KnowledgeCategoryTabs
          active={activeCategory}
          counts={categoryCounts}
          onChange={handleCategoryChange}
        />
      </div>

      {/* Main content: list + detail */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Entry list */}
        <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:w-80 lg:shrink-0">
          <KnowledgeEntryList
            entries={entries}
            selectedId={selectedId}
            loading={loading}
            onSelect={setSelectedId}
          />
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 dark:border-gray-800">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 dark:text-gray-400"
              >
                Anterior
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {page}/{totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 dark:text-gray-400"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="hidden min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:flex">
          {selectedEntry ? (
            <KnowledgeEntryDetail
              projectId={projectId}
              entry={selectedEntry}
              onDeleted={handleEntryDeleted}
              onUpdated={handleEntryUpdated}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Selecciona una entrada para ver su contenido
            </div>
          )}
        </div>
      </div>

      {/* Note editor modal */}
      {showEditor && (
        <KnowledgeNoteEditor
          projectId={projectId}
          onCreated={handleNoteCreated}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}
