'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DesignStatus, DesignType } from '@/types/design'

type ArtifactDetailProps = {
  projectId: string
  artifact: {
    id: string
    type: DesignType
    screen_name: string
    status: DesignStatus
    created_at: string
  }
  content: string | null
}

const TYPE_LABELS: Record<DesignType, string> = {
  wireframe: 'Wireframe',
  mockup_lowfi: 'Mockup Low-Fi',
  mockup_highfi: 'Mockup High-Fi',
}

const STATUS_LABELS: Record<DesignStatus, string> = {
  generating: 'Generando...',
  draft: 'Borrador',
  approved: 'Aprobado',
}

export function ArtifactDetail({ projectId, artifact, content }: ArtifactDetailProps) {
  const [status, setStatus] = useState<DesignStatus>(artifact.status)
  const [refineInput, setRefineInput] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [displayContent, setDisplayContent] = useState(content ?? '')
  const [isApproving, setIsApproving] = useState(false)

  async function handleApprove() {
    setIsApproving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/designs/${artifact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      if (res.ok) {
        setStatus('approved')
      }
    } finally {
      setIsApproving(false)
    }
  }

  async function handleRefine() {
    if (!refineInput.trim()) return
    setIsRefining(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/designs/${artifact.id}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: refineInput }),
      })

      if (!res.ok) return

      // Reload page to get the updated content from storage
      setStatus('draft')
      setRefineInput('')
      window.location.reload()
    } finally {
      setIsRefining(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/designs`}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            &larr; Disenos
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{artifact.screen_name}</h1>
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
            {TYPE_LABELS[artifact.type]}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              status === 'approved'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : status === 'generating'
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>

        {status !== 'approved' && (
          <button
            onClick={handleApprove}
            disabled={isApproving || status === 'generating'}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {isApproving ? 'Aprobando...' : 'Aprobar diseno'}
          </button>
        )}
      </div>

      {/* Content display */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        {displayContent ? (
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
            {displayContent}
          </pre>
        ) : (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {status === 'generating' ? 'Generando diseno...' : 'Sin contenido disponible.'}
          </p>
        )}
      </div>

      {/* Refine section */}
      {status !== 'approved' && (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Refinar diseno</h3>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              placeholder="Ej: Agrega un sidebar de navegacion, cambia el layout a 3 columnas..."
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              disabled={isRefining}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleRefine()
                }
              }}
            />
            <button
              onClick={handleRefine}
              disabled={isRefining || !refineInput.trim()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              {isRefining ? 'Refinando...' : 'Refinar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
