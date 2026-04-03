'use client'

import { useState } from 'react'
import { extractCodeFiles } from '@/lib/ai/code-extractor'

type ActionStreamingPanelProps = {
  content: string | null
  isStreaming: boolean
  onApplyToRepo?: () => Promise<{ success: boolean; url?: string }>
  onClose: () => void
  title?: string
}

export function ActionStreamingPanel({
  content,
  isStreaming,
  onApplyToRepo,
  onClose,
  title = 'Resultado de la accion',
}: ActionStreamingPanelProps) {
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [commitUrl, setCommitUrl] = useState<string | null>(null)

  if (!content && !isStreaming) return null

  const files = content ? extractCodeFiles(content) : []

  async function handleApply() {
    if (!onApplyToRepo) return
    setApplying(true)
    const result = await onApplyToRepo()
    setApplying(false)
    if (result.success) {
      setApplied(true)
      if (result.url) setCommitUrl(result.url)
    }
  }

  return (
    <div className="rounded-lg border-2 border-[#0EA5A3]/30 dark:border-[#0F2B46] bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-[#0F2B46] dark:text-[#0EA5A3]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E8F4F8]0" />
              Generando...
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Files preview */}
      {files.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            {files.length} archivo{files.length !== 1 ? 's' : ''} generado{files.length !== 1 ? 's' : ''}:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {files.map((f) => (
              <span
                key={f.path}
                className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-mono text-gray-700 dark:text-gray-300"
              >
                {f.path}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-h-96 overflow-y-auto p-4">
        <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300 font-mono">
          {content}
        </pre>
      </div>

      {/* Actions */}
      {!isStreaming && content && (
        <div className="flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          {applied ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Aplicado al repositorio
              {commitUrl && (
                <a
                  href={commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F2B46] dark:text-[#0EA5A3] underline"
                >
                  Ver commit
                </a>
              )}
            </div>
          ) : onApplyToRepo ? (
            <button
              onClick={handleApply}
              disabled={applying || files.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {applying ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Aplicando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Aplicar al repo ({files.length} archivos)
                </>
              )}
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
