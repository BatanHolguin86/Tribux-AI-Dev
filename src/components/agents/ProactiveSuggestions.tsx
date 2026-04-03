'use client'

import { useState, useEffect } from 'react'

type Suggestion = {
  id: string
  text: string
  agent_hint: string
}

type ProactiveSuggestionsProps = {
  projectId: string
  agentType: string
  onSuggestionClick: (text: string) => void
}

export function ProactiveSuggestions({
  projectId,
  agentType,
  onSuggestionClick,
}: ProactiveSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Cache suggestions in sessionStorage for 30 min — avoids API call on every page load
      const cacheKey = `suggestions:${projectId}:${agentType}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        try {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < 30 * 60 * 1000) {
            if (!cancelled) { setSuggestions(data); setLoading(false) }
            return
          }
        } catch { /* ignore malformed cache */ }
      }

      try {
        const res = await fetch(
          `/api/projects/${projectId}/agents/suggestions?agent_type=${agentType}`,
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (!cancelled) {
          const suggestions = data.suggestions ?? []
          setSuggestions(suggestions)
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: suggestions, ts: Date.now() }))
        }
      } catch {
        // Silently fail — suggestions are optional
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [projectId, agentType])

  if (dismissed || (!loading && suggestions.length === 0)) return null

  if (loading) {
    return (
      <div className="mx-4 mb-4 animate-pulse rounded-lg border border-[#E8F4F8] bg-[#E8F4F8] p-4">
        <div className="h-3 w-40 rounded bg-[#0EA5A3]/30" />
        <div className="mt-3 space-y-2">
          <div className="h-8 rounded bg-[#E8F4F8]" />
          <div className="h-8 rounded bg-[#E8F4F8]" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 mb-4 rounded-lg border border-[#0EA5A3]/30 bg-[#E8F4F8] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#0F2B46]">Sugerencias basadas en tu proyecto</p>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-[#0EA5A3] hover:text-[#0F2B46]"
          aria-label="Descartar sugerencias"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-2 space-y-1.5">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSuggestionClick(s.text)}
            className="w-full rounded-lg bg-white px-3 py-2 text-left text-sm text-gray-700 shadow-sm transition-colors hover:bg-[#E8F4F8] hover:text-[#0F2B46]"
          >
            {s.text}
          </button>
        ))}
      </div>
    </div>
  )
}
