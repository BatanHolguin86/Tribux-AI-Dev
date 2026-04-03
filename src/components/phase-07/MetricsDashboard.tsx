'use client'

import { useState } from 'react'
import type { ActionExecution } from '@/types/action'

type VercelDeployment = {
  url: string
  state: string
  created: number
}

type VercelMetrics = {
  recentDeployments?: VercelDeployment[]
  deploymentCount?: number
  skipped?: boolean
  reason?: string
  error?: string
}

type SentryMetrics = {
  errorStats?: Array<[number, number]>
  period?: string
  skipped?: boolean
  reason?: string
  error?: string
}

type CollectedMetrics = {
  collectedAt: string
  vercel: VercelMetrics | null
  sentry: SentryMetrics | null
}

function getLatestMetrics(executions: ActionExecution[]): CollectedMetrics | null {
  const successful = executions
    .filter((e) => e.action_name === 'collect-metrics' && e.status === 'success' && e.result_data)
    .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))

  if (successful.length === 0) return null

  const data = successful[0].result_data as Record<string, unknown> | null
  if (!data) return null

  return {
    collectedAt: (data.collectedAt as string) ?? '',
    vercel: (data.vercel as VercelMetrics) ?? null,
    sentry: (data.sentry as SentryMetrics) ?? null,
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatTimestamp(ts: number) {
  try {
    return new Date(ts).toLocaleString('es', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(ts)
  }
}

const STATE_BADGE: Record<string, string> = {
  READY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  BUILDING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  QUEUED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  CANCELED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function MetricsDashboard({
  projectId,
  executions,
}: {
  projectId: string
  executions: ActionExecution[]
}) {
  const [metrics, setMetrics] = useState<CollectedMetrics | null>(() =>
    getLatestMetrics(executions),
  )
  const [collecting, setCollecting] = useState(false)

  async function handleCollect() {
    setCollecting(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/phases/7/actions/collect-metrics`,
        { method: 'POST' },
      )
      if (res.ok) {
        const data = await res.json()
        if (data.metrics) setMetrics(data.metrics as CollectedMetrics)
      }
    } catch { /* non-fatal */ } finally {
      setCollecting(false)
    }
  }

  // ── No metrics yet ──────────────────────────────────────────────────────────
  if (!metrics) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900/50">
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          No hay metricas recolectadas aun. Ejecuta la accion para obtener datos de Vercel y Sentry.
        </p>
        <button
          onClick={handleCollect}
          disabled={collecting}
          className="inline-flex items-center gap-2 rounded-md bg-[#0F2B46] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A1F33] disabled:opacity-50"
        >
          {collecting && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {collecting ? 'Recolectando…' : 'Recolectar metricas'}
        </button>
      </div>
    )
  }

  const vercel = metrics.vercel
  const sentry = metrics.sentry

  const totalSentryErrors =
    sentry?.errorStats
      ? sentry.errorStats.reduce((sum, [, count]) => sum + count, 0)
      : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold font-display text-gray-900 dark:text-gray-100">
            Metricas del Producto
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ultima recoleccion: {formatDate(metrics.collectedAt)}
          </p>
        </div>
        <button
          onClick={handleCollect}
          disabled={collecting}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {collecting ? (
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Actualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ── Vercel Deployments ──────────────────────────────────────────────── */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-gray-900 dark:text-white" aria-hidden>
              <path d="M12 1L24 22H0L12 1z" />
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Vercel</span>
          </div>

          {vercel?.skipped ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {vercel.reason ?? 'Token no configurado'}
            </p>
          ) : vercel?.error ? (
            <p className="text-xs text-red-600 dark:text-red-400">{vercel.error}</p>
          ) : vercel?.recentDeployments && vercel.recentDeployments.length > 0 ? (
            <>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                {vercel.deploymentCount} deploys recientes
              </p>
              <ul className="space-y-2">
                {vercel.recentDeployments.map((d, i) => (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${STATE_BADGE[d.state] ?? STATE_BADGE['QUEUED']}`}>
                        {d.state}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatTimestamp(d.created)}
                      </span>
                    </div>
                    {d.url && (
                      <a
                        href={`https://${d.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-[#0F2B46] underline hover:text-[#0F2B46] dark:text-[#0EA5A3]"
                        title={d.url}
                      >
                        {d.url.length > 30 ? d.url.slice(0, 30) + '…' : d.url}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">Sin deploys recientes</p>
          )}
        </div>

        {/* ── Sentry Errors ──────────────────────────────────────────────────── */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-gray-900 dark:text-white" aria-hidden>
              <path d="M13.91 2.505c-.873-1.448-2.972-1.448-3.845 0L6.572 8.17a2.235 2.235 0 00-.188.345 8.359 8.359 0 015.09 7.604h-2.089a6.27 6.27 0 00-3.822-5.67l-2.37 3.93c-.873 1.449.174 3.286 1.923 3.286H7.09a8.343 8.343 0 003.503 4.17l1.325-2.2a6.278 6.278 0 01-2.619-3.12l-.004-.015h3.832c0-3.17-1.76-5.942-4.357-7.382L11.988 3.93l7.327 12.16h-3.22l1.325 2.2h3.818c1.749 0 2.796-1.837 1.922-3.286L13.91 2.505z" />
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Sentry</span>
          </div>

          {sentry?.skipped ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sentry.reason ?? 'Token no configurado'}
            </p>
          ) : sentry?.error ? (
            <p className="text-xs text-red-600 dark:text-red-400">{sentry.error}</p>
          ) : sentry?.errorStats ? (
            <>
              <div className="mb-3">
                <span className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
                  {totalSentryErrors}
                </span>
                <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                  errores ({sentry.period ?? '24h'})
                </span>
              </div>
              {/* Mini bar chart */}
              <div className="flex items-end gap-px" style={{ height: '40px' }}>
                {sentry.errorStats.map(([ts, count], i) => {
                  const max = Math.max(...sentry.errorStats!.map(([, c]) => c), 1)
                  const pct = (count / max) * 100
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-red-400 dark:bg-red-500"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      title={`${formatTimestamp(ts * 1000)}: ${count} errores`}
                    />
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">Sin datos de errores</p>
          )}
        </div>
      </div>
    </div>
  )
}
