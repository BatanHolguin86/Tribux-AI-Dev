'use client'

import { useEffect, useState, useRef } from 'react'

type DeployStatus = {
  status: string
  url: string | null
  source: string | null
  createdAt?: string
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; spin: boolean }> = {
  pending:      { label: 'Iniciando deploy…',  cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300', spin: true  },
  queued:       { label: 'En cola…',            cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300', spin: true  },
  in_progress:  { label: 'Deployando…',         cls: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300',         spin: true  },
  waiting:      { label: 'Esperando…',           cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300', spin: true  },
  success:      { label: 'Deploy exitoso',       cls: 'text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300',     spin: false },
  failure:      { label: 'Deploy fallido',       cls: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300',             spin: false },
  error:        { label: 'Error en deploy',      cls: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300',             spin: false },
  not_started:  { label: 'Sin deploy reciente',  cls: 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400',            spin: false },
}

const TERMINAL = ['success', 'failure', 'error']
const ACTIVE    = ['pending', 'queued', 'in_progress', 'waiting']

export function DeployStatusWidget({ projectId }: { projectId: string }) {
  const [deploy, setDeploy] = useState<DeployStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function poll() {
    try {
      const res = await fetch(`/api/projects/${projectId}/phases/6/actions/deploy-status`)
      if (res.ok) {
        const data: DeployStatus = await res.json()
        setDeploy(data)

        // Stop polling when terminal state or not started
        if (TERMINAL.includes(data.status) || data.status === 'not_started' || data.status === 'no_repo') {
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      }
    } catch { /* non-fatal */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    poll()
    // Poll every 8 seconds while active
    intervalRef.current = setInterval(poll, 8000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Re-enable polling when status goes active again (e.g. new deploy triggered)
  useEffect(() => {
    if (deploy && ACTIVE.includes(deploy.status) && !intervalRef.current) {
      intervalRef.current = setInterval(poll, 8000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deploy?.status])

  if (loading || !deploy || deploy.status === 'not_started' || deploy.status === 'no_repo') return null

  const config = STATUS_CONFIG[deploy.status] ?? STATUS_CONFIG['not_started']

  return (
    <div className={`mt-3 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${config.cls}`}>
      <div className="flex items-center gap-2">
        {config.spin ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : TERMINAL.includes(deploy.status) ? (
          deploy.status === 'success' ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        ) : null}
        <span className="font-medium">{config.label}</span>
        {deploy.source && (
          <span className="text-xs opacity-60">vía {deploy.source === 'github_deployment' ? 'Vercel' : 'GitHub Actions'}</span>
        )}
      </div>
      {deploy.url && (
        <a
          href={deploy.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs underline opacity-80 hover:opacity-100"
        >
          {deploy.status === 'success' ? 'Ver app →' : 'Ver logs →'}
        </a>
      )}
    </div>
  )
}
