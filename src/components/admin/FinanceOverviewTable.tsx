'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type UserRow = {
  userId: string
  fullName: string | null
  plan: string
  subscriptionStatus: string
  trialEndsAt: string | null
  createdAt: string
  role: string
  costCurrentMonthUsd: number
  costPreviousMonthUsd: number
  planPriceUsd: number
  marginRatio: number
  inputTokensCurrentMonth: number
  outputTokensCurrentMonth: number
}

type InfraCosts = {
  supabase: number
  vercel: number
  anthropicPlatform: number
  domain: number
  sentry: number
  resend: number
  other: number
}

type OverviewResponse = {
  summary: {
    totalUsers: number
    totalCostCurrentMonthUsd: number
    totalCostPreviousMonthUsd: number
    totalRevenueCurrentMonthUsd: number
    totalInfraCostUsd: number
    totalCostsUsd: number
    netProfitUsd: number
    infraCosts: InfraCosts
  }
  users: UserRow[]
}

const INFRA_LABELS: Record<keyof InfraCosts, { name: string; desc: string }> = {
  supabase: { name: 'Supabase', desc: 'DB + Auth + Storage' },
  vercel: { name: 'Vercel', desc: 'Hosting + Edge' },
  anthropicPlatform: { name: 'Anthropic', desc: 'Cuota plataforma' },
  domain: { name: 'Dominio', desc: 'Registro anual' },
  sentry: { name: 'Sentry', desc: 'Error tracking' },
  resend: { name: 'Resend', desc: 'Emails' },
  other: { name: 'Otros', desc: 'Servicios adicionales' },
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  active: { label: 'Activo', classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
  trialing: { label: 'Trial', classes: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' },
  canceled: { label: 'Cancelado', classes: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
  free: { label: 'Free', classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  past_due: { label: 'Pendiente', classes: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
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

export function FinanceOverviewTable() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState<string>('')

  useEffect(() => {
    setLoading(true)
    const params = month ? `?month=${encodeURIComponent(month)}` : ''
    fetch(`/api/admin/finance/overview${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? 'Acceso denegado' : 'Error al cargar')
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [month])

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

  const { summary, users } = data
  const now = new Date()
  const currentMonthLabel =
    month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const infraEntries = Object.entries(summary.infraCosts).filter(
    ([, v]) => v > 0,
  ) as [keyof InfraCosts, number][]

  const marginPct = summary.totalRevenueCurrentMonthUsd > 0
    ? ((summary.netProfitUsd / summary.totalRevenueCurrentMonthUsd) * 100).toFixed(0)
    : '0'

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <input
        type="month"
        value={month || currentMonthLabel}
        onChange={(e) => setMonth(e.target.value || '')}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ingresos del mes"
          value={formatUsd(summary.totalRevenueCurrentMonthUsd)}
          subtitle={`${summary.totalUsers} usuario${summary.totalUsers !== 1 ? 's' : ''}`}
          variant="revenue"
        />
        <KpiCard
          label="Costos totales"
          value={formatUsd(summary.totalCostsUsd)}
          subtitle={`IA ${formatUsd(summary.totalCostCurrentMonthUsd)} + Infra ${formatUsd(summary.totalInfraCostUsd)}`}
          variant="cost"
        />
        <KpiCard
          label="Ganancia neta"
          value={formatUsd(summary.netProfitUsd)}
          subtitle={`Margen: ${marginPct}%`}
          variant="profit"
        />
        <KpiCard
          label="Costo IA mes anterior"
          value={formatUsd(summary.totalCostPreviousMonthUsd)}
          subtitle={
            summary.totalCostPreviousMonthUsd > 0
              ? `${summary.totalCostCurrentMonthUsd > summary.totalCostPreviousMonthUsd ? '+' : ''}${(((summary.totalCostCurrentMonthUsd - summary.totalCostPreviousMonthUsd) / summary.totalCostPreviousMonthUsd) * 100).toFixed(0)}% vs actual`
              : 'Sin datos previos'
          }
        />
      </div>

      {/* Infrastructure costs */}
      {infraEntries.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Costos de infraestructura
            <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">mensuales</span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {infraEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3 border border-gray-100 dark:border-gray-700"
              >
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {INFRA_LABELS[key].name}
                  </span>
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {INFRA_LABELS[key].desc}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                  {formatUsd(value)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-violet-50 dark:bg-violet-900/20 px-4 py-3 border border-violet-200 dark:border-violet-800">
              <div>
                <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                  Costo IA
                </span>
                <span className="block text-[11px] text-violet-500 dark:text-violet-400 mt-0.5">
                  Variable por uso
                </span>
              </div>
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300 tabular-nums">
                {formatUsd(summary.totalCostCurrentMonthUsd)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-gray-900 dark:to-indigo-950/20 px-4 py-3 border border-violet-200 dark:border-violet-800">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Total costos del mes</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
              {formatUsd(summary.totalCostsUsd)}
            </span>
          </div>
        </div>
      )}

      {/* Users table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Detalle por usuario
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Usuario
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Plan
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Costo IA
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Precio plan
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                  Margen
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const status = STATUS_CONFIG[u.subscriptionStatus] ?? STATUS_CONFIG.free
                const isLast = i === users.length - 1
                return (
                  <tr
                    key={u.userId}
                    className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-[11px] font-bold text-white shadow-sm shrink-0">
                          {(u.fullName || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-[13px]">
                            {u.fullName || 'Sin nombre'}
                          </span>
                          <span className="block text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                            {u.userId.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full bg-violet-100 dark:bg-violet-900/30 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 dark:text-violet-400 uppercase">
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.classes}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums text-[13px]">
                        {formatUsd(u.costCurrentMonthUsd)}
                      </span>
                      <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
                        {u.inputTokensCurrentMonth.toLocaleString()} in / {u.outputTokensCurrentMonth.toLocaleString()} out
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-medium text-gray-700 dark:text-gray-300 tabular-nums text-[13px]">
                        {u.planPriceUsd > 0 ? formatUsd(u.planPriceUsd) : 'Custom'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.planPriceUsd > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-[13px] font-bold tabular-nums ${
                              u.marginRatio >= 0.6
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : u.marginRatio >= 0.3
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {(u.marginRatio * 100).toFixed(0)}%
                          </span>
                          <div className="h-1 w-12 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                u.marginRatio >= 0.6
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                  : u.marginRatio >= 0.3
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                    : 'bg-gradient-to-r from-red-500 to-red-400'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, u.marginRatio * 100))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-center block">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/finance/users/${u.userId}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm shadow-violet-500/25 transition-all hover:shadow-md hover:shadow-violet-500/30 hover:brightness-110"
                      >
                        Detalle
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400 dark:text-gray-500">
                    No hay usuarios registrados en este periodo.
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
