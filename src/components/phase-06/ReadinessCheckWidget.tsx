'use client'

import { useEffect, useState } from 'react'
import { useFounderMode, founderLabel } from '@/hooks/useFounderMode'

type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip'

type ReadinessCheck = {
  id: string
  label: string
  status: CheckStatus
  detail: string
  url?: string
}

type ReadinessData = {
  score: number
  overall: 'ready' | 'not_ready'
  checks: ReadinessCheck[]
  summary: string
}

const STATUS_STYLE: Record<CheckStatus, { icon: string; cls: string }> = {
  pass: { icon: '✓', cls: 'text-green-600 dark:text-green-400' },
  fail: { icon: '✗', cls: 'text-red-600 dark:text-red-400' },
  warn: { icon: '!', cls: 'text-yellow-600 dark:text-yellow-400' },
  skip: { icon: '—', cls: 'text-gray-400 dark:text-gray-500' },
}

export function ReadinessCheckWidget({ projectId }: { projectId: string }) {
  const { isFounder } = useFounderMode()
  const [data, setData] = useState<ReadinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  async function fetchReadiness() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/readiness`)
      if (res.ok) setData(await res.json())
    } catch { /* non-fatal */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReadiness()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  if (loading) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
        <svg className="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-gray-500 dark:text-gray-400">Verificando readiness…</span>
      </div>
    )
  }

  if (!data) return null

  const isReady = data.overall === 'ready'
  const barColor = data.score >= 80
    ? 'bg-green-500'
    : data.score >= 50
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <div
      className={`mb-4 rounded-lg border p-4 ${
        isReady
          ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg">
            {isReady ? '🟢' : data.score >= 50 ? '🟡' : '🔴'}
          </div>
          <div>
            <h3 className="text-sm font-semibold font-display text-gray-900 dark:text-gray-100">
              Go / No-Go — {data.score}%
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{data.summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReadiness()}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            title="Actualizar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${data.score}%` }}
        />
      </div>

      {/* Expanded checks */}
      {expanded && (
        <div className="mt-4 space-y-2">
          {data.checks.map((check) => {
            const style = STATUS_STYLE[check.status]
            return (
              <div
                key={check.id}
                className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 dark:border-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`text-sm font-bold ${style.cls}`}>{style.icon}</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">{founderLabel(check.label, isFounder)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{check.detail}</span>
                  {check.url && (
                    <a
                      href={check.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0F2B46] underline hover:text-[#0F2B46] dark:text-[#0EA5A3]"
                    >
                      Ver →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
