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
  const [accepting, setAccepting] = useState(false)
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
        throw new Error(
          body.message || body.error || `Error ${res.status}`
        )
      }

      const data = await res.json()
      const features = data.features ?? []
      setSuggestions(features)
      setFetched(true)

      if (features.length === 0) {
        setError('No se generaron sugerencias. Verifica que el Discovery (Phase 00) esté completado y aprobado.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar sugerencias. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function acceptSuggestions() {
    setAccepting(true)
    for (const s of suggestions) {
      await fetch(`/api/projects/${projectId}/phases/1/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: s.name, description: s.description }),
      })
    }
    setAccepting(false)
    onAccepted()
  }

  if (fetched && suggestions.length === 0 && !error) return null

  return (
    <div className="rounded-lg border-2 border-dashed border-violet-200 bg-violet-50 p-4">
      {!fetched || error ? (
        <div className="text-center">
          <p className="text-sm text-violet-700">
            El orquestador puede sugerir features basados en tu discovery.
          </p>
          {error && (
            <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Generando sugerencias...' : error ? 'Reintentar' : 'Pedir sugerencias'}
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-violet-800">Features sugeridos</h3>
          <div className="mt-2 space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="rounded-lg bg-white p-3">
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">{s.description}</p>
              </div>
            ))}
          </div>
          <button
            onClick={acceptSuggestions}
            disabled={accepting}
            className="mt-3 w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            {accepting ? 'Creando features...' : `Aceptar ${suggestions.length} features`}
          </button>
        </div>
      )}
    </div>
  )
}
