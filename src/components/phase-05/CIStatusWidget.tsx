'use client'

import { useEffect, useState, useRef } from 'react'

type CIStatus = {
  status: string
  conclusion: string | null
  html_url: string | null
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; spin: boolean }> = {
  queued:       { label: 'CI en cola…',              cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300', spin: true  },
  in_progress:  { label: 'CI ejecutándose…',         cls: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300',         spin: true  },
  waiting:      { label: 'CI esperando…',             cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300', spin: true  },
  completed:    { label: 'CI completado',             cls: 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400',            spin: false },
  not_found:    { label: 'Sin workflow CI',           cls: 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400',            spin: false },
}

const CONCLUSION_CONFIG: Record<string, { label: string; cls: string }> = {
  success:      { label: 'CI pasó exitosamente',     cls: 'text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300' },
  failure:      { label: 'CI falló',                  cls: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300'         },
  cancelled:    { label: 'CI cancelado',              cls: 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400'        },
  timed_out:    { label: 'CI timeout',                cls: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300'         },
}

const ACTIVE_STATUSES = ['queued', 'in_progress', 'waiting']

export function CIStatusWidget({ projectId }: { projectId: string }) {
  const [ci, setCI] = useState<CIStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function poll() {
    try {
      const res = await fetch(`/api/projects/${projectId}/phases/5/actions/ci-status`)
      if (res.ok) {
        const data: CIStatus = await res.json()
        setCI(data)

        if (!ACTIVE_STATUSES.includes(data.status)) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch { /* non-fatal */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, 8000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    if (ci && ACTIVE_STATUSES.includes(ci.status) && !intervalRef.current) {
      intervalRef.current = setInterval(poll, 8000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ci?.status])

  if (loading || !ci || ci.status === 'not_found') return null

  const isCompleted = ci.status === 'completed' && ci.conclusion
  const config = isCompleted
    ? (CONCLUSION_CONFIG[ci.conclusion!] ?? STATUS_CONFIG['completed'])
    : (STATUS_CONFIG[ci.status] ?? STATUS_CONFIG['not_found'])
  const isActive = ACTIVE_STATUSES.includes(ci.status)
  const isSuccess = ci.conclusion === 'success'
  const isFailed = ci.conclusion === 'failure' || ci.conclusion === 'timed_out'

  return (
    <div className={`mt-3 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${config.cls}`}>
      <div className="flex items-center gap-2">
        {isActive ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : isSuccess ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : isFailed ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : null}
        <span className="font-medium">{config.label}</span>
      </div>
      {ci.html_url && (
        <a
          href={ci.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs underline opacity-80 hover:opacity-100"
        >
          {isSuccess ? 'Ver run →' : 'Ver logs →'}
        </a>
      )}
    </div>
  )
}
