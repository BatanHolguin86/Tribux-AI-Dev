'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type AutoGenerateCardProps = {
  projectId: string
  missingCount: number
}

export function AutoGenerateCard({ projectId, missingCount }: AutoGenerateCardProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setProgress(0)

    // Simulate progress while waiting
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 95))
    }, 800)

    try {
      const res = await fetch(`/api/projects/${projectId}/phases/2/auto-generate`, {
        method: 'POST',
      })

      clearInterval(interval)

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Error' }))
        throw new Error(body.message ?? `Error ${res.status}`)
      }

      const data = await res.json()
      setProgress(100)
      setDone(true)

      // Refresh page to show generated documents
      setTimeout(() => router.refresh(), 1500)
    } catch (err) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : 'Error al generar documentos')
      setGenerating(false)
    }
  }

  if (done) {
    return (
      <div className="mb-6 rounded-xl border-2 border-[#10B981] bg-[#10B981]/10 p-6 text-center">
        <div className="mb-2 text-4xl">✅</div>
        <h3 className="font-display text-lg font-display font-bold text-[#0F2B46] dark:text-white">
          Documentacion tecnica generada
        </h3>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Los 4 documentos de arquitectura fueron creados automaticamente. Cargando...
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-xl border-2 border-[#0EA5A3]/30 bg-gradient-to-br from-white to-[#E8F4F8]/50 p-6 dark:from-[#0F2B46] dark:to-[#0A1F33]">
      <div className="flex items-start gap-4">
        <span className="text-3xl">🏗️</span>
        <div className="flex-1">
          <h3 className="font-display text-base font-bold text-[#0F2B46] dark:text-white">
            Generando arquitectura automaticamente
          </h3>
          <p className="mt-1 text-sm text-[#94A3B8]">
            La IA creara {missingCount} documentos tecnicos basados en tu Discovery y tus features.
            Esto toma ~1 minuto. Tu no necesitas hacer nada.
          </p>

          {generating && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>Generando documentos...</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#0A1F33]">
                <div
                  className="h-full rounded-full bg-[#0EA5A3] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-[#0EA5A3]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-[#0EA5A3]">
                  {progress < 25 ? 'Analizando tu proyecto...' :
                   progress < 50 ? 'Disenando arquitectura...' :
                   progress < 75 ? 'Definiendo base de datos...' :
                   'Finalizando documentos...'}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {!generating && (
            <button
              onClick={handleGenerate}
              className="mt-4 rounded-lg bg-[#0EA5A3] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0C8C8A]"
            >
              Generar arquitectura automaticamente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
