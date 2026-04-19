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

const PHASE_META: Record<number, { label: string; shortLabel: string; icon: string }> = {
  0: { label: 'Discovery', shortLabel: 'Discovery', icon: '🔍' },
  1: { label: 'Requirements & Spec', shortLabel: 'Specs', icon: '📋' },
  2: { label: 'Architecture', shortLabel: 'Arquitectura', icon: '🏗️' },
  3: { label: 'Environment Setup', shortLabel: 'Infra', icon: '⚙️' },
  4: { label: 'Development', shortLabel: 'Desarrollo', icon: '💻' },
  5: { label: 'Testing & QA', shortLabel: 'Testing', icon: '🧪' },
  6: { label: 'Launch', shortLabel: 'Lanzamiento', icon: '🚀' },
  7: { label: 'Iteration', shortLabel: 'Iteracion', icon: '🔄' },
}

type KnowledgeLayoutProps = {
  projectId: string
  initialEntries: KnowledgeBaseEntry[]
  initialTotal: number
  categoryCounts: Record<string, number>
  phaseCounts: Record<number, number>
}

export function KnowledgeLayout({
  projectId,
  initialEntries,
  initialTotal,
  categoryCounts: initialCounts,
  phaseCounts: initialPhaseCounts,
}: KnowledgeLayoutProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [total, setTotal] = useState(initialTotal)
  const [categoryCounts, setCategoryCounts] = useState(initialCounts)
  const [phaseCounts] = useState(initialPhaseCounts)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialEntries[0]?.id ?? null
  )
  const [activeCategory, setActiveCategory] = useState<KBCategory | null>(null)
  const [activePhase, setActivePhase] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null

  const fetchEntries = useCallback(
    async (cat: KBCategory | null, phase: number | null, q: string, p: number) => {
      setLoading(true)
      const params = new URLSearchParams()
      if (cat) params.set('category', cat)
      if (phase !== null) params.set('phase', String(phase))
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
      void fetchEntries(activeCategory, activePhase, searchQuery, page)
    })
  }, [activeCategory, activePhase, searchQuery, page, fetchEntries])

  const handleCategoryChange = useCallback((cat: KBCategory | null) => {
    setActiveCategory(cat)
    setPage(1)
  }, [])

  const handlePhaseChange = useCallback((phase: number | null) => {
    setActivePhase(phase)
    setPage(1)
  }, [])

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    setPage(1)
  }, [])

  const handleNoteCreated = useCallback(() => {
    setShowEditor(false)
    setPage(1)
    fetchEntries(activeCategory, activePhase, searchQuery, 1)
    refreshCounts()
  }, [activeCategory, activePhase, searchQuery, fetchEntries, refreshCounts])

  const handleEntryDeleted = useCallback(() => {
    setSelectedId(null)
    fetchEntries(activeCategory, activePhase, searchQuery, page)
    refreshCounts()
  }, [activeCategory, activePhase, searchQuery, page, fetchEntries, refreshCounts])

  const handleEntryUpdated = useCallback(
    (updated: KnowledgeBaseEntry) => {
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    },
    []
  )

  const handleSeeded = useCallback(() => {
    fetchEntries(null, null, '', 1)
    refreshCounts()
    setActiveCategory(null)
    setActivePhase(null)
    setSearchQuery('')
  }, [fetchEntries, refreshCounts])

  const totalAll = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
  const hasNoEntries = totalAll === 0 && !searchQuery && !activeCategory && activePhase === null

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

      {/* Main 3-column layout */}
      <div className="flex min-h-0 flex-1 gap-3">
        {/* Left: Phase navigation */}
        <div className="hidden w-52 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:flex">
          {/* "Todos" button */}
          <button
            onClick={() => handlePhaseChange(null)}
            className={`flex items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors ${
              activePhase === null
                ? 'border-l-3 border-l-brand-teal bg-brand-teal/5 font-semibold text-brand-primary dark:text-brand-teal'
                : 'border-l-3 border-l-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
            }`}
          >
            <span className="text-sm">📚</span>
            <span className="flex-1">Todos</span>
            <span className="text-[10px] text-brand-muted">{totalAll}</span>
          </button>

          <div className="mx-3 border-t border-gray-100 dark:border-gray-800" />

          {/* Phase buttons */}
          <div className="flex-1 overflow-y-auto">
            {Object.entries(PHASE_META).map(([phaseStr, meta]) => {
              const phase = parseInt(phaseStr)
              const count = phaseCounts[phase] ?? 0
              const isActive = activePhase === phase

              return (
                <button
                  key={phase}
                  onClick={() => handlePhaseChange(phase)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'border-l-3 border-l-brand-teal bg-brand-teal/5 font-medium text-brand-primary dark:text-brand-teal'
                      : 'border-l-3 border-l-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
                  } ${count === 0 ? 'opacity-40' : ''}`}
                  disabled={count === 0}
                >
                  <span className="text-sm">{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-brand-muted">
                      {String(phase).padStart(2, '0')}
                    </div>
                    <div className="truncate text-[13px]">{meta.shortLabel}</div>
                  </div>
                  {count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      isActive
                        ? 'bg-brand-teal/20 text-brand-teal'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Center: Search + Category + Entry list */}
        <div className="flex w-full min-w-0 flex-col lg:w-80 lg:shrink-0">
          {/* Search + category tabs */}
          <div className="mb-3 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900">
            <KnowledgeSearch value={searchQuery} onChange={handleSearch} />
            <KnowledgeCategoryTabs
              active={activeCategory}
              counts={categoryCounts}
              onChange={handleCategoryChange}
            />
          </div>

          {/* Entry list */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            {/* Phase title when filtered */}
            {activePhase !== null && (
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
                <span className="text-sm">{PHASE_META[activePhase]?.icon}</span>
                <span className="text-xs font-semibold text-brand-primary dark:text-gray-200">
                  Phase {String(activePhase).padStart(2, '0')} — {PHASE_META[activePhase]?.label}
                </span>
              </div>
            )}

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
        </div>

        {/* Right: Detail panel */}
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
