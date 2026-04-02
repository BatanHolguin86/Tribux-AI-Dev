'use client'

import { useState } from 'react'

type ExportStatus = 'idle' | 'generating' | 'complete' | 'error'

export function ExportTransferButton({
  projectId,
  projectName,
}: {
  projectId: string
  projectName?: string
}) {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setStatus('generating')
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/export/transfer-bundle`, {
        method: 'POST',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: `Error ${res.status}` }))
        throw new Error(body.message ?? 'Error al generar bundle')
      }

      const blob = await res.blob()
      const slug = (projectName ?? 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug}-transfer-bundle.zip`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexion')
      setStatus('error')
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📦</span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Exportar proyecto
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Descarga un ZIP con toda la documentacion, disenos, esquema de base de datos e instrucciones de transferencia para entregar a tu cliente.
          </p>

          {error && (
            <div className="mt-2 rounded-md border-l-4 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {status === 'complete' && (
            <div className="mt-2 rounded-md border-l-4 border-green-500 bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Bundle descargado exitosamente.
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={status === 'generating'}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {status === 'generating' ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando bundle...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar bundle de transferencia
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
