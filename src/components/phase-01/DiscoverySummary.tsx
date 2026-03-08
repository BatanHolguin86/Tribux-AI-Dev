'use client'

import { useState } from 'react'

type DiscoverySummaryProps = {
  docs: Array<{ section: string; content: string }>
}

const SECTION_NAMES: Record<string, string> = {
  problem_statement: 'Problem Statement',
  personas: 'User Personas',
  value_proposition: 'Value Proposition',
  metrics: 'Success Metrics',
  competitive_analysis: 'Competitive Analysis',
}

export function DiscoverySummary({ docs }: DiscoverySummaryProps) {
  const [expanded, setExpanded] = useState(false)

  if (docs.length === 0) return null

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>Discovery aprobado ({docs.length} documentos)</span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-gray-100 px-4 py-3">
          {docs.map((doc) => (
            <div key={doc.section}>
              <h4 className="text-xs font-semibold text-gray-600">
                {SECTION_NAMES[doc.section] ?? doc.section}
              </h4>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">{doc.content.slice(0, 200)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
