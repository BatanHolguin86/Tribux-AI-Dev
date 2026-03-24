'use client'

import { useState } from 'react'
import { extractCodeFiles } from '@/lib/ai/code-extractor'

type ApplyToSupabaseButtonProps = {
  content: string
  projectId: string
  supabaseProjectRef: string
}

export function ApplyToSupabaseButton({ content, projectId, supabaseProjectRef }: ApplyToSupabaseButtonProps) {
  const [expanded, setExpanded] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<{ rowCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Extract only SQL code blocks
  const sqlFiles = extractCodeFiles(content).filter(
    (f) => f.language === 'sql' || f.path.endsWith('.sql'),
  )

  if (sqlFiles.length === 0 || !supabaseProjectRef) return null

  const combinedSql = sqlFiles.map((f) => f.content).join('\n\n')
  const previewLines = combinedSql.split('\n').slice(0, 5)

  async function handleExecute() {
    setExecuting(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/sql/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: combinedSql }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Error al ejecutar SQL')
        return
      }

      setResult({ rowCount: data.rowCount })
      setExpanded(false)
    } catch {
      setError('Error de conexion')
    } finally {
      setExecuting(false)
    }
  }

  if (result) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/50">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        SQL ejecutado ({result.rowCount} fila{result.rowCount !== 1 ? 's' : ''})
      </span>
    )
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/50"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        Ejecutar {sqlFiles.length} SQL en Supabase
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800/50 dark:bg-emerald-900/10">
      <div className="mb-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        SQL a ejecutar:
      </div>
      <pre className="mb-2 max-h-32 overflow-auto rounded bg-gray-900 p-2 text-[11px] leading-relaxed text-gray-100">
        {previewLines.join('\n')}
        {combinedSql.split('\n').length > 5 && (
          <span className="text-gray-500">{'\n'}... ({combinedSql.split('\n').length - 5} lineas mas)</span>
        )}
      </pre>

      <div className="mb-2 flex items-center gap-1.5 rounded bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.832c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        Esto ejecutara SQL directamente en tu proyecto Supabase. Revisa antes de confirmar.
      </div>

      {error && (
        <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setExpanded(false)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Cancelar
        </button>
        <button
          onClick={handleExecute}
          disabled={executing}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {executing ? 'Ejecutando...' : 'Confirmar y ejecutar'}
        </button>
      </div>
    </div>
  )
}
