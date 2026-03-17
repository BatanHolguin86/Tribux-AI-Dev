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
  supabase: 'Supabase',
  vercel: 'Vercel',
  anthropicPlatform: 'Anthropic (fija)',
  domain: 'Dominio',
  sentry: 'Sentry',
  resend: 'Resend',
  other: 'Otros',
}

const INFRA_DESCRIPTIONS: Record<keyof InfraCosts, string> = {
  supabase: 'DB + Auth + Storage',
  vercel: 'Hosting + Edge',
  anthropicPlatform: 'Cuota plataforma',
  domain: 'Registro anual',
  sentry: 'Error tracking',
  resend: 'Emails transaccionales',
  other: 'Servicios adicionales',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: 'Activo', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  trialing: { label: 'Trial', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  canceled: { label: 'Cancelado', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  free: { label: 'Free', bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' },
  past_due: { label: 'Pago pendiente', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
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
  icon,
  accent = 'default',
}: {
  label: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  accent?: 'default' | 'green' | 'red' | 'blue'
}) {
  const accentStyles = {
    default: 'from-gray-800/80 to-gray-900/80 border-gray-700/50',
    green: 'from-emerald-950/40 to-gray-900/80 border-emerald-800/30',
    red: 'from-red-950/30 to-gray-900/80 border-red-800/20',
    blue: 'from-blue-950/30 to-gray-900/80 border-blue-800/20',
  }

  const valueStyles = {
    default: 'text-white',
    green: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  }

  const iconBg = {
    default: 'bg-gray-700/50 text-gray-300',
    green: 'bg-emerald-500/15 text-emerald-400',
    red: 'bg-red-500/15 text-red-400',
    blue: 'bg-blue-500/15 text-blue-400',
  }

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${accentStyles[accent]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[13px] font-medium text-gray-400 tracking-wide">{label}</p>
          <p className={`text-[28px] font-bold leading-none tracking-tight ${valueStyles[accent]}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[12px] text-gray-500 leading-relaxed">{subtitle}</p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg[accent]}`}>
          {icon}
        </div>
      </div>
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
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
        {error}
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-violet-500/30 border-t-violet-500" />
          <p className="text-sm text-gray-500">Cargando datos financieros...</p>
        </div>
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
    <div className="space-y-8">
      {/* Month selector */}
      <div>
        <input
          type="month"
          value={month || currentMonthLabel}
          onChange={(e) => setMonth(e.target.value || '')}
          className="rounded-xl border border-gray-700/50 bg-gray-800/50 px-4 py-2 text-sm text-gray-200 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ingresos del mes"
          value={formatUsd(summary.totalRevenueCurrentMonthUsd)}
          subtitle={`${summary.totalUsers} usuario${summary.totalUsers !== 1 ? 's' : ''} registrado${summary.totalUsers !== 1 ? 's' : ''}`}
          accent="blue"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
        />
        <KpiCard
          label="Costos totales"
          value={formatUsd(summary.totalCostsUsd)}
          subtitle={`IA ${formatUsd(summary.totalCostCurrentMonthUsd)} + Infra ${formatUsd(summary.totalInfraCostUsd)}`}
          accent="red"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          }
        />
        <KpiCard
          label="Ganancia neta"
          value={formatUsd(summary.netProfitUsd)}
          subtitle={`Margen: ${marginPct}%`}
          accent="green"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <KpiCard
          label="Costo IA mes anterior"
          value={formatUsd(summary.totalCostPreviousMonthUsd)}
          subtitle={
            summary.totalCostPreviousMonthUsd > 0
              ? `${summary.totalCostCurrentMonthUsd > summary.totalCostPreviousMonthUsd ? '+' : ''}${(((summary.totalCostCurrentMonthUsd - summary.totalCostPreviousMonthUsd) / summary.totalCostPreviousMonthUsd) * 100).toFixed(0)}% vs mes actual`
              : 'Sin datos previos'
          }
          accent="default"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Infrastructure costs */}
      {infraEntries.length > 0 && (
        <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/40 to-gray-900/60 p-6">
          <div className="flex items-center gap-2 mb-5">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-300">
              Costos de infraestructura
            </h3>
            <span className="text-[11px] text-gray-600 ml-1">mensuales fijos</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {infraEntries.map(([key, value]) => (
              <div
                key={key}
                className="group flex items-center justify-between rounded-xl bg-gray-800/60 px-4 py-3.5 border border-gray-700/30 hover:border-gray-600/50 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium text-gray-300">
                    {INFRA_LABELS[key]}
                  </span>
                  <span className="block text-[11px] text-gray-600 mt-0.5">
                    {INFRA_DESCRIPTIONS[key]}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-200 tabular-nums">
                  {formatUsd(value)}
                </span>
              </div>
            ))}
            {/* AI variable cost card */}
            <div className="flex items-center justify-between rounded-xl bg-violet-500/8 px-4 py-3.5 border border-violet-500/15">
              <div>
                <span className="text-sm font-medium text-violet-300">
                  Costo IA
                </span>
                <span className="block text-[11px] text-violet-500 mt-0.5">
                  Variable por uso
                </span>
              </div>
              <span className="text-sm font-bold text-violet-300 tabular-nums">
                {formatUsd(summary.totalCostCurrentMonthUsd)}
              </span>
            </div>
          </div>
          {/* Total bar */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-900/80 px-4 py-3 border border-gray-700/30">
            <span className="text-sm font-semibold text-gray-300">Total costos del mes</span>
            <span className="text-lg font-bold text-white tabular-nums">
              {formatUsd(summary.totalCostsUsd)}
            </span>
          </div>
        </div>
      )}

      {/* Users table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-300">
            Detalle por usuario
          </h3>
          <span className="ml-auto text-[12px] text-gray-600">
            {users.length} usuario{users.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-700/50 bg-gray-900/40">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-700/50 bg-gray-800/30">
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Usuario
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Plan
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Estado
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500 text-right">
                  Costo IA
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500 text-right">
                  Precio plan
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500 text-center">
                  Margen
                </th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const status = STATUS_CONFIG[u.subscriptionStatus] ?? STATUS_CONFIG.free
                const isLast = i === users.length - 1
                return (
                  <tr
                    key={u.userId}
                    className={`transition-colors hover:bg-white/[0.02] ${!isLast ? 'border-b border-gray-800/50' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-[11px] font-bold text-violet-300 shrink-0">
                          {(u.fullName || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-gray-100 text-[13px]">
                            {u.fullName || 'Sin nombre'}
                          </span>
                          <span className="block text-[11px] text-gray-600 font-mono mt-0.5">
                            {u.userId.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-md bg-gray-800/80 px-2.5 py-1 text-[11px] font-semibold text-gray-300 uppercase tracking-wide border border-gray-700/50">
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${status.bg} ${status.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-gray-100 tabular-nums text-[13px]">
                        {formatUsd(u.costCurrentMonthUsd)}
                      </span>
                      <span className="block text-[11px] text-gray-600 mt-0.5 tabular-nums">
                        {u.inputTokensCurrentMonth.toLocaleString()} in / {u.outputTokensCurrentMonth.toLocaleString()} out
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-medium text-gray-300 tabular-nums text-[13px]">
                        {u.planPriceUsd > 0 ? formatUsd(u.planPriceUsd) : 'Custom'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.planPriceUsd > 0 ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={`text-[13px] font-bold tabular-nums ${
                              u.marginRatio >= 0.6
                                ? 'text-emerald-400'
                                : u.marginRatio >= 0.3
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                            }`}
                          >
                            {(u.marginRatio * 100).toFixed(0)}%
                          </span>
                          <div className="h-1 w-14 rounded-full bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                u.marginRatio >= 0.6
                                  ? 'bg-emerald-500'
                                  : u.marginRatio >= 0.3
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, u.marginRatio * 100))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-700 text-center block">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/finance/users/${u.userId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-1.5 text-[12px] font-medium text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-all border border-violet-500/10 hover:border-violet-500/20"
                      >
                        Ver detalle
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-gray-600">
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
