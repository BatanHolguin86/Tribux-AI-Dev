'use client'

import { useEffect, useState } from 'react'

type UserDetail = {
  userId: string
  fullName: string | null
  plan: string
  subscriptionStatus: string
  trialEndsAt: string | null
  createdAt: string
  role: string
  planPriceUsd: number
}

type DetailResponse = {
  user: UserDetail
  totalCostAllTimeUsd: number
  monthlyBreakdown: Array<{
    month: string
    costUsd: number
    inputTokens: number
    outputTokens: number
    events: number
  }>
  eventTypeBreakdown: Array<{
    eventType: string
    costUsd: number
    inputTokens: number
    outputTokens: number
    count: number
  }>
  recentEvents: Array<{
    id: string
    projectId: string | null
    eventType: string
    model: unknown
    inputTokens: number
    outputTokens: number
    estimatedCostUsd: number
    createdAt: string
  }>
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  active: { label: 'Activo', classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
  trialing: { label: 'Trial', classes: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' },
  canceled: { label: 'Cancelado', classes: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
  free: { label: 'Free', classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  past_due: { label: 'Pendiente', classes: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
}

const EVENT_LABELS: Record<string, string> = {
  agent_chat: 'Chat con agente',
  phase00_chat: 'Chat Phase 00',
  phase00_generate: 'Generar Phase 00',
  phase01_chat: 'Chat Phase 01',
  phase01_generate: 'Generar Phase 01',
  phase02_chat: 'Chat Phase 02',
  phase02_generate: 'Generar Phase 02',
  design_generate: 'Generar diseño',
  design_refine: 'Refinar diseño',
  thread_title: 'Título de hilo',
  suggestions: 'Sugerencias',
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatUsdPrecise(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value)
}

function resolveModelName(model: unknown): string {
  if (!model) return '—'
  if (typeof model === 'string') return model
  if (typeof model === 'object') {
    const obj = model as Record<string, unknown>
    if (typeof obj.modelId === 'string') return obj.modelId
    if (typeof obj.id === 'string') return obj.id
    if (typeof obj.name === 'string') return obj.name
    return JSON.stringify(model)
  }
  return String(model)
}

function KpiCard({
  label,
  value,
  subtitle,
  variant = 'default',
}: {
  label: string
  value: string
  subtitle?: string
  variant?: 'default' | 'revenue' | 'cost' | 'profit'
}) {
  const valueColor = {
    default: 'text-gray-900 dark:text-white',
    revenue: 'text-violet-700 dark:text-violet-400',
    cost: 'text-red-600 dark:text-red-400',
    profit: 'text-emerald-600 dark:text-emerald-400',
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueColor[variant]}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
    </div>
  )
}

export function UserFinanceDetail({ userId }: { userId: string }) {
  const [data, setData] = useState<DetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/finance/users/${encodeURIComponent(userId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Usuario no encontrado' : 'Error al cargar')
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-5 py-4 text-sm text-red-700 dark:text-red-300">
        {error}
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-violet-500/30 border-t-violet-500" />
      </div>
    )
  }

  const { user, totalCostAllTimeUsd, monthlyBreakdown, eventTypeBreakdown, recentEvents } = data
  const status = STATUS_CONFIG[user.subscriptionStatus] ?? STATUS_CONFIG.free

  const initials = (user.fullName || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const totalEvents = eventTypeBreakdown.reduce((sum, r) => sum + r.count, 0)
  const totalInputTokens = eventTypeBreakdown.reduce((sum, r) => sum + r.inputTokens, 0)
  const totalOutputTokens = eventTypeBreakdown.reduce((sum, r) => sum + r.outputTokens, 0)

  return (
    <div className="space-y-6">
      {/* User profile header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white shadow-lg shadow-violet-500/25 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {user.fullName || 'Usuario'}
              </h1>
              <span className="inline-flex rounded-full bg-violet-100 dark:bg-violet-900/30 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 dark:text-violet-400 uppercase">
                {user.plan}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.classes}`}>
                {status.label}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-mono">{user.userId.slice(0, 8)}…</span>
              <span>Rol: {user.role}</span>
              <span>Registro: {new Date(user.createdAt).toLocaleDateString('es-CL')}</span>
              {user.planPriceUsd > 0 && <span>Precio: {formatUsd(user.planPriceUsd)}/mes</span>}
              {user.trialEndsAt && (
                <span>Trial hasta: {new Date(user.trialEndsAt).toLocaleDateString('es-CL')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Costo IA total"
          value={formatUsd(totalCostAllTimeUsd)}
          subtitle="Histórico acumulado"
          variant="cost"
        />
        <KpiCard
          label="Llamadas IA"
          value={totalEvents.toLocaleString()}
          subtitle={`${totalInputTokens.toLocaleString()} in / ${totalOutputTokens.toLocaleString()} out`}
        />
        <KpiCard
          label="Ingreso plan"
          value={user.planPriceUsd > 0 ? formatUsd(user.planPriceUsd) : 'Custom'}
          subtitle="Por mes"
          variant="revenue"
        />
        <KpiCard
          label="Margen estimado"
          value={
            user.planPriceUsd > 0 && monthlyBreakdown.length > 0
              ? `${Math.max(0, ((1 - monthlyBreakdown[0].costUsd / user.planPriceUsd) * 100)).toFixed(0)}%`
              : '—'
          }
          subtitle={
            user.planPriceUsd > 0 && monthlyBreakdown.length > 0
              ? `Costo mes actual: ${formatUsd(monthlyBreakdown[0].costUsd)}`
              : 'Sin datos'
          }
          variant="profit"
        />
      </div>

      {/* Monthly breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Costo por mes
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Mes
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Costo (USD)
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Tokens in
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Tokens out
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Eventos
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyBreakdown.map((row, i) => {
                const isLast = i === monthlyBreakdown.length - 1
                return (
                  <tr
                    key={row.month}
                    className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{row.month}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      {formatUsd(row.costUsd)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                      {row.inputTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                      {row.outputTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                      {row.events}
                    </td>
                  </tr>
                )
              })}
              {monthlyBreakdown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                    Sin datos de consumo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event type breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Costo por tipo de evento
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tipo
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Costo (USD)
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Llamadas
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Tokens in
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Tokens out
                </th>
              </tr>
            </thead>
            <tbody>
              {eventTypeBreakdown.map((row, i) => {
                const isLast = i === eventTypeBreakdown.length - 1
                const pct = totalCostAllTimeUsd > 0
                  ? (row.costUsd / totalCostAllTimeUsd) * 100
                  : 0
                return (
                  <tr
                    key={row.eventType}
                    className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-[13px]">
                          {EVENT_LABELS[row.eventType] || row.eventType}
                        </span>
                        <span className="inline-flex rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-400 tabular-nums">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      {formatUsd(row.costUsd)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                      {row.count}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                      {row.inputTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                      {row.outputTokens.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              {eventTypeBreakdown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                    Sin datos de consumo.
                  </td>
                </tr>
              )}
            </tbody>
            {eventTypeBreakdown.length > 0 && (
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-gray-900 dark:to-indigo-950/20">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Total</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatUsd(totalCostAllTimeUsd)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400 tabular-nums">
                    {totalEvents.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400 tabular-nums">
                    {totalInputTokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400 tabular-nums">
                    {totalOutputTokens.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Recent events */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Últimos eventos
          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">hasta 100</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Fecha
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tipo
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Modelo
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Tokens
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Costo
                </th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((e, i) => {
                const isLast = i === recentEvents.length - 1
                return (
                  <tr
                    key={e.id}
                    className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100">
                        {EVENT_LABELS[e.eventType] || e.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-mono text-gray-600 dark:text-gray-400">
                        {resolveModelName(e.model)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
                      <span className="text-violet-600 dark:text-violet-400">{e.inputTokens.toLocaleString()}</span>
                      <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
                      <span>{e.outputTokens.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 tabular-nums text-[13px]">
                      {formatUsdPrecise(Number(e.estimatedCostUsd))}
                    </td>
                  </tr>
                )
              })}
              {recentEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                    Sin eventos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
