'use client'

import { useState } from 'react'

type KnowledgeEmptyStateProps = {
  projectId: string
  onSeeded: () => void
}

export function KnowledgeEmptyState({ projectId, onSeeded }: KnowledgeEmptyStateProps) {
  const [seeding, setSeeding] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSeed() {
    setSeeding(true)
    setResult(null)

    const res = await fetch(`/api/projects/${projectId}/knowledge/seed`, {
      method: 'POST',
    })

    if (res.ok) {
      const data = await res.json()
      if (data.created > 0) {
        setResult(`${data.created} entrada${data.created !== 1 ? 's' : ''} indexada${data.created !== 1 ? 's' : ''}`)
        setTimeout(onSeeded, 1500)
      } else {
        setResult('No hay documentos aprobados para indexar todavia.')
      }
    } else {
      setResult('Error al indexar documentos.')
    }

    setSeeding(false)
  }

  return (
    <div className="flex h-[var(--content-height)] items-center justify-center">
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 px-8 py-12 text-center dark:border-gray-600 dark:bg-gray-900/40">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl dark:bg-violet-900/30">
          📚
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Base de Conocimiento
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Tu biblioteca centralizada de documentos, decisiones, guias y notas del proyecto.
          Los documentos aprobados se indexan automaticamente.
        </p>

        {result && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            {result}
          </p>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            {seeding ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Indexando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Indexar documentos existentes
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Importa todos los documentos aprobados del proyecto
          </p>
        </div>
      </div>
    </div>
  )
}
