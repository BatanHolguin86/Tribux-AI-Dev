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

const INFRA_LABELS: Record<keyof InfraCosts, string> = {
  supabase: 'Supabase (DB + Auth + Storage)',
  vercel: 'Vercel (Hosting + Edge)',
  anthropicPlatform: 'Anthropic (cuota fija)',
  domain: 'Dominio',
  sentry: 'Sentry (Error tracking)',
  resend: 'Resend (Emails)',
  other: 'Otros',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Activo', color: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' },
  trialing: { label: 'Trial', color: 'bg-violet-400/10 text-violet-400 ring-violet-400/20' },
  canceled: { label: 'Cancelado', color: 'bg-red-400/10 text-red-400 ring-red-400/20' },
  free: { label: 'Free', color: 'bg-gray-400/10 text-gray-400 ring-gray-400/20' },
  past_due: { label: 'Pago pendiente', color: 'bg-amber-400/10 text-amber-400 ring-amber-400/20' },
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function StatCard({
  label,
  value,
  subvalue,
  trend,
}: {
  label: string
  value: string
  subvalue?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <p className="text-sm font-medium text-gray-400">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          trend === 'up'
            ? 'text-emerald-400'
            : trend === 'down'
              ? 'text-red-400'
              : 'text-gray-100'
        }`}
      >
        {value}
      </p>
      {subvalue && <p className="mt-1 text-xs text-gray-500">{subvalue}</p>}
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
        if (!res.ok)
          throw new Error(res.status === 403 ? 'Acceso denegado' : 'Error al cargar')
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [month])

  if (error) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950/30 px-5 py-4 text-sm text-red-300">
        {error}
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex items-center gap-3 text-gray-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        Cargando datos financieros...
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

  return (
    <div className="space-y-8">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          Periodo:
          <input
            type="month"
            value={month || currentMonthLabel}
            onChange={(e) => setMonth(e.target.value || '')}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </label>
      </div>

      {/* Summary cards — row 1: revenue & profit */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ingresos del mes"
          value={formatUsd(summary.totalRevenueCurrentMonthUsd)}
          subvalue={`${summary.totalUsers} usuario${summary.totalUsers !== 1 ? 's' : ''} registrado${summary.totalUsers !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Costos totales"
          value={formatUsd(summary.totalCostsUsd)}
          subvalue={`IA: ${formatUsd(summary.totalCostCurrentMonthUsd)} + Infra: ${formatUsd(summary.totalInfraCostUsd)}`}
          trend="down"
        />
        <StatCard
          label="Ganancia neta"
          value={formatUsd(summary.netProfitUsd)}
          subvalue={
            summary.totalRevenueCurrentMonthUsd > 0
              ? `Margen: ${((summary.netProfitUsd / summary.totalRevenueCurrentMonthUsd) * 100).toFixed(0)}%`
              : 'Sin ingresos'
          }
          trend={summary.netProfitUsd >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Costo IA mes anterior"
          value={formatUsd(summary.totalCostPreviousMonthUsd)}
          subvalue={
            summary.totalCostPreviousMonthUsd > 0
              ? `${summary.totalCostCurrentMonthUsd > summary.totalCostPreviousMonthUsd ? '+' : ''}${(((summary.totalCostCurrentMonthUsd - summary.totalCostPreviousMonthUsd) / summary.totalCostPreviousMonthUsd) * 100).toFixed(0)}% vs actual`
              : 'Sin datos previos'
          }
        />
      </div>

      {/* Infrastructure costs breakdown */}
      {infraEntries.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">
            Costos de infraestructura (mensuales)
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {infraEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-3"
              >
                <span className="text-sm text-gray-400">
                  {INFRA_LABELS[key]}
                </span>
                <span className="text-sm font-semibold text-gray-200">
                  {formatUsd(value)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-violet-500/10 px-4 py-3 ring-1 ring-violet-500/20">
              <span className="text-sm font-medium text-violet-300">
                Costo IA (variable)
              </span>
              <span className="text-sm font-semibold text-violet-200">
                {formatUsd(summary.totalCostCurrentMonthUsd)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-200 mb-3">
          Detalle por usuario
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/50">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Usuario
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Plan
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Costo IA (mes)
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Precio plan
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Margen
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {users.map((u) => {
                const status = STATUS_LABELS[u.subscriptionStatus] ?? STATUS_LABELS.free
                return (
                  <tr
                    key={u.userId}
                    className="transition-colors hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-100">
                          {u.fullName || 'Sin nombre'}
                        </span>
                        <span className="block text-xs text-gray-600 font-mono">
                          {u.userId.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-300 capitalize">
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-100">
                        {formatUsd(u.costCurrentMonthUsd)}
                      </span>
                      <span className="block text-xs text-gray-600">
                        {u.inputTokensCurrentMonth.toLocaleString()} in /{' '}
                        {u.outputTokensCurrentMonth.toLocaleString()} out
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-300">
                      {u.planPriceUsd > 0 ? formatUsd(u.planPriceUsd) : 'Custom'}
                    </td>
                    <td className="px-4 py-3">
                      {u.planPriceUsd > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                u.marginRatio >= 0.6
                                  ? 'bg-emerald-500'
                                  : u.marginRatio >= 0.3
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, u.marginRatio * 100))}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              u.marginRatio >= 0.6
                                ? 'text-emerald-400'
                                : u.marginRatio >= 0.3
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                            }`}
                          >
                            {(u.marginRatio * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/finance/users/${u.userId}`}
                        className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-violet-400 hover:bg-gray-700 hover:text-violet-300 transition-colors"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No hay usuarios registrados.
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
