'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'

type Artifact = {
  id: string
  thread_id: string | null
  title: string
  type: string
  content: string
  status: string
  created_at: string
  updated_at: string
}

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'brand_strategy', label: 'Brand Strategy' },
  { value: 'gtm_plan', label: 'GTM Plan' },
  { value: 'content_strategy', label: 'Content Strategy' },
  { value: 'growth_experiment', label: 'Growth Experiment' },
  { value: 'sales_playbook', label: 'Sales Playbook' },
  { value: 'competitive_messaging', label: 'Competitive Intel' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los status' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'archived', label: 'Archived' },
]

const TYPE_LABELS: Record<string, string> = {
  brand_strategy: 'Brand Strategy',
  gtm_plan: 'GTM Plan',
  content_strategy: 'Content Strategy',
  growth_experiment: 'Growth Experiment',
  sales_playbook: 'Sales Playbook',
  competitive_messaging: 'Competitive Intel',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  archived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

const TYPE_COLORS: Record<string, string> = {
  brand_strategy: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  gtm_plan: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  content_strategy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  growth_experiment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  sales_playbook: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  competitive_messaging: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
}

export function MarketingArtifactList() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadArtifacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType) params.set('type', filterType)
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/admin/marketing/artifacts?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setArtifacts(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus])

  useEffect(() => {
    void loadArtifacts()
  }, [loadArtifacts])

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/marketing/artifacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setArtifacts((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
      }
    } catch {
      // silent
    }
  }

  async function deleteArtifact(id: string) {
    try {
      const res = await fetch(`/api/admin/marketing/artifacts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setArtifacts((prev) => prev.filter((a) => a.id !== id))
        if (expandedId === id) setExpandedId(null)
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">
          Artefactos Estrategicos
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Documentos generados por el Marketing Strategist
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-brand-navy dark:text-gray-300"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-brand-navy dark:text-gray-300"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          {artifacts.length} artefacto{artifacts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Artifact list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : artifacts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-brand-navy">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No hay artefactos{filterType || filterStatus ? ' con estos filtros' : ' aun'}. Usa el Marketing Strategist para generar documentos estrategicos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {artifacts.map((artifact) => (
            <div
              key={artifact.id}
              className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-brand-navy overflow-hidden"
            >
              {/* Card header */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                onClick={() => setExpandedId(expandedId === artifact.id ? null : artifact.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {artifact.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${TYPE_COLORS[artifact.type] ?? ''}`}>
                      {TYPE_LABELS[artifact.type] ?? artifact.type}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_COLORS[artifact.status] ?? STATUS_COLORS.draft}`}>
                      {artifact.status}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(artifact.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {artifact.status === 'draft' && (
                    <button
                      onClick={() => void updateStatus(artifact.id, 'approved')}
                      className="rounded-lg p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      title="Aprobar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </button>
                  )}
                  {artifact.status !== 'archived' && (
                    <button
                      onClick={() => void updateStatus(artifact.id, 'archived')}
                      className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                      title="Archivar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => void deleteArtifact(artifact.id)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>

                {/* Expand chevron */}
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${expandedId === artifact.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              {/* Expanded content */}
              {expandedId === artifact.id && (
                <div className="border-t-2 border-brand-teal/20 bg-gray-50/50 px-6 py-5 dark:border-brand-teal/10 dark:bg-gray-800/30">
                  {artifact.content?.trim() ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                      <ReactMarkdown>{artifact.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin contenido guardado</p>
                  )}
                  <div className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(artifact.content ?? '')
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                      📋 Copiar texto
                    </button>
                    <span className="text-[10px] text-gray-400">
                      {(artifact.content ?? '').length} caracteres
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
