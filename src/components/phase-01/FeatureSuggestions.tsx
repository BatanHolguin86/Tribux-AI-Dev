'use client'

import { useState } from 'react'

type Suggestion = { name: string; description: string; priority: number }

type FeatureSuggestionsProps = {
  projectId: string
  onAccepted: () => void
}

export function FeatureSuggestions({ projectId, onAccepted }: FeatureSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [addingIdx, setAddingIdx] = useState<number | null>(null)
  const [addingAll, setAddingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchSuggestions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/phases/1/features/suggest`, {
        method: 'POST',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || body.error || `Error ${res.status}`)
      }

      const data = await res.json()
      const features = data.features ?? []
      setSuggestions(features)
      setFetched(true)

      if (features.length === 0) {
        setError('No se generaron sugerencias. Verifica que el Discovery (Phase 00) este completado.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar sugerencias.')
    } finally {
      setLoading(false)
    }
  }

  async function addFeature(index: number) {
    const s = suggestions[index]
    setAddingIdx(index)
    try {
      const res = await fetch(`/api/projects/${projectId}/phases/1/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: s.name, description: s.description }),
      })
      if (res.ok) {
        setSuggestions((prev) => prev.filter((_, i) => i !== index))
        onAccepted()
      }
    } finally {
      setAddingIdx(null)
    }
  }

  async function addAll() {
    setAddingAll(true)
    for (const s of suggestions) {
      await fetch(`/api/projects/${projectId}/phases/1/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: s.name, description: s.description }),
      })
    }
    setSuggestions([])
    setAddingAll(false)
    onAccepted()
  }

  if (fetched && suggestions.length === 0 && !error) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {!fetched || error ? (
        <div className="p-4 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F4F8] dark:bg-[#0F2B46]/30">
            <svg className="h-5 w-5 text-[#0F2B46] dark:text-[#0EA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Sugerencias IA
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Genera features basados en tu Discovery
          </p>
          {error && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </p>
          )}
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A1F33] disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generando...
              </>
            ) : error ? (
              'Reintentar'
            ) : (
              'Pedir sugerencias'
            )}
          </button>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Sugerencias ({suggestions.length})
            </h3>
            {suggestions.length > 1 && (
              <button
                onClick={addAll}
                disabled={addingAll || addingIdx !== null}
                className="text-xs font-medium text-[#0F2B46] transition-colors hover:text-[#0F2B46] disabled:opacity-50 dark:text-[#0EA5A3] dark:hover:text-[#0EA5A3]"
              >
                {addingAll ? 'Agregando...' : 'Agregar todas'}
              </button>
            )}
          </div>

          {/* Suggestion cards */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {suggestions.map((s, i) => (
              <div key={i} className="group flex gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
                    {s.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {s.description}
                  </p>
                </div>
                <button
                  onClick={() => addFeature(i)}
                  disabled={addingIdx !== null || addingAll}
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-[#0EA5A3] hover:bg-[#E8F4F8] hover:text-[#0F2B46] disabled:opacity-50 dark:border-gray-700 dark:hover:border-[#0A1F33] dark:hover:bg-[#0F2B46]/20 dark:hover:text-[#0EA5A3]"
                  title="Agregar este feature"
                >
                  {addingIdx === i ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#0EA5A3] border-t-[#0F2B46]" />
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
