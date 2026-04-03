'use client'

import { useState } from 'react'
import { KB_CATEGORY_LABELS, KB_CATEGORY_ICONS } from '@/types/knowledge'
import type { KnowledgeBaseEntry } from '@/types/knowledge'
import { DocumentViewer } from '@/components/shared/document/DocumentViewer'

type KnowledgeEntryDetailProps = {
  projectId: string
  entry: KnowledgeBaseEntry
  onDeleted: () => void
  onUpdated: (entry: KnowledgeBaseEntry) => void
}

export function KnowledgeEntryDetail({
  projectId,
  entry,
  onDeleted,
  onUpdated,
}: KnowledgeEntryDetailProps) {
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const date = new Date(entry.updated_at)
  const dateStr = date.toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  async function handleTogglePin() {
    const res = await fetch(
      `/api/projects/${projectId}/knowledge/${entry.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !entry.is_pinned }),
      }
    )
    if (res.ok) {
      const updated = await res.json()
      onUpdated(updated)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(
      `/api/projects/${projectId}/knowledge/${entry.id}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      onDeleted()
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-start justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {entry.title}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {KB_CATEGORY_ICONS[entry.category]}
              {KB_CATEGORY_LABELS[entry.category]}
            </span>
            {entry.phase_number !== null && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Phase {String(entry.phase_number).padStart(2, '0')}
              </span>
            )}
            {entry.source_type && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Auto-indexado
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {dateStr}
            </span>
          </div>
          {entry.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#E8F4F8] px-2 py-0.5 text-[10px] font-medium text-[#0F2B46] dark:bg-[#0F2B46]/20 dark:text-[#0EA5A3]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => window.open(`/api/projects/${projectId}/export/document?type=knowledge_entry&docId=${entry.id}`, '_blank')}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            title="Descargar como Markdown"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={handleTogglePin}
            className={`rounded-lg p-2 text-sm transition-colors ${
              entry.is_pinned
                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'
            }`}
            title={entry.is_pinned ? 'Desfijar' : 'Fijar'}
          >
            <svg className="h-4 w-4" fill={entry.is_pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
          </button>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Eliminar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '...' : 'Eliminar'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <DocumentViewer content={entry.content ?? ''} />
      </div>
    </div>
  )
}
