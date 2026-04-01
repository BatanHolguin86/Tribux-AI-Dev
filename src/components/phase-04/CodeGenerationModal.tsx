'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { extractCodeFiles, type ExtractedFile } from '@/lib/ai/code-extractor'
import type { TaskWithFeature } from '@/types/task'

type CodeGenerationModalProps = {
  projectId: string
  task: TaskWithFeature
  isOpen: boolean
  onClose: () => void
  onTaskStatusChange?: (taskId: string, newStatus: 'review') => void
}

export function CodeGenerationModal({
  projectId,
  task,
  isOpen,
  onClose,
  onTaskStatusChange,
}: CodeGenerationModalProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [commitResult, setCommitResult] = useState<{
    sha: string
    url: string
    filesChanged: number
  } | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const contentRef = useRef<HTMLPreElement>(null)

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (contentRef.current && isStreaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [content, isStreaming])

  const startGeneration = useCallback(async () => {
    setIsStreaming(true)
    setContent('')
    setError(null)
    setCommitResult(null)
    setHasStarted(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/phases/4/actions/generate-task-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Error desconocido' }))
        setError(data.message ?? `Error ${res.status}`)
        setIsStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setError('No se pudo leer la respuesta')
        setIsStreaming(false)
        return
      }

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setContent(fullText)
      }

      setIsStreaming(false)

      // After streaming completes, the backend has already committed.
      // Extract files to show in the UI.
      const extractedFiles = extractCodeFiles(fullText)
      if (extractedFiles.length > 0) {
        // Task status was already updated to 'review' by the backend
        onTaskStatusChange?.(task.id, 'review')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexion')
      setIsStreaming(false)
    }
  }, [projectId, task.id, onTaskStatusChange])

  // Start generation automatically when modal opens
  useEffect(() => {
    if (isOpen && !hasStarted && !isStreaming) {
      startGeneration()
    }
  }, [isOpen, hasStarted, isStreaming, startGeneration])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasStarted(false)
      setContent('')
      setError(null)
      setCommitResult(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const files: ExtractedFile[] = content ? extractCodeFiles(content) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
              <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Generando codigo
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {task.task_key} — {task.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <span className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
                Generando...
              </span>
            )}
            <button
              onClick={onClose}
              disabled={isStreaming}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Files preview */}
        {files.length > 0 && (
          <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {files.length} archivo{files.length !== 1 ? 's' : ''} generado{files.length !== 1 ? 's' : ''}:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {files.map((f) => (
                <span
                  key={f.path}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {f.path}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {!content && isStreaming && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <svg className="h-8 w-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Analizando contexto y generando codigo...
                </p>
              </div>
            </div>
          )}
          <pre
            ref={contentRef}
            className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-xs font-mono text-gray-700 dark:text-gray-300"
          >
            {content}
          </pre>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {!isStreaming && files.length > 0 && !error && (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Codigo generado y aplicado al repositorio
              </span>
            )}
            {commitResult && (
              <a
                href={commitResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-violet-600 underline dark:text-violet-400"
              >
                Ver commit
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isStreaming}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
