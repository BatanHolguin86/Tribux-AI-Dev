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

type PlanGoldenRecord = {
  plan: string
  planPriceUsd: number
  monthlyBudgetUsd: number
  targetMarginPct: number
  totalUsersOnPlan: number
  activeUsersOnPlan: number
  totalCostForPlanUsd: number
  avgCostPerUserUsd: number
  budgetUsedPct: number
  usersAboveBudget: number
  atRisk: boolean
}

type OpCostRow = { id: string; label: string; description: string; monthlyUsd: number }

type OverviewResponse = {
  summary: {
    totalUsers: number
    totalCostCurrentMonthUsd: number
    totalCostPreviousMonthUsd: number
    totalRevenueCurrentMonthUsd: number
    totalPlanRevenueUsd: number
    totalCreditRevenueUsd: number
    totalInfraCostUsd: number
    totalCostsUsd: number
    netProfitUsd: number
    infraCosts: InfraCosts
    rangeMonths?: number
    periodStart?: string
    periodEnd?: string
    ownerView?: {
      breakEvenUsers: number
      activePayingUsers: number
      trialUsers: number
    }
  }
  users: UserRow[]
  planGoldenRecord: PlanGoldenRecord[]
  operationalCosts?: OpCostRow[]
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
  trialing: { label: 'Trial', classes: 'bg-brand-surface dark:bg-brand-primary/20 text-brand-primary dark:text-brand-teal' },
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
    revenue: 'text-brand-primary dark:text-brand-teal',
    cost: 'text-red-600 dark:text-red-400',
    profit: 'text-emerald-600 dark:text-emerald-400',
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-md hover:border-brand-teal dark:hover:border-[#0A1F33]">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-display font-bold ${valueColor[variant]}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
    </div>
  )
}

type OperationalCost = { id: string; label: string; description: string | null; monthly_usd: number }

export function FinanceOverviewTable() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState<string>('')
  const [rangeMonths, setRangeMonths] = useState<number>(1)
  const [editingCosts, setEditingCosts] = useState(false)
  const [opCosts, setOpCosts] = useState<OperationalCost[]>([])
  const [savingCost, setSavingCost] = useState<string | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true)
      const params = new URLSearchParams()
      if (month) params.set('month', month)
      if (rangeMonths > 1) params.set('months', String(rangeMonths))
      const qs = params.toString() ? `?${params.toString()}` : ''
      fetch(`/api/admin/finance/overview${qs}`)
        .then((res) => {
          if (!res.ok) throw new Error(res.status === 403 ? 'Acceso denegado' : 'Error al cargar')
          return res.json()
        })
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    })
  }, [month, rangeMonths])

  async function loadOpCosts() {
    const res = await fetch('/api/admin/finance/costs')
    if (res.ok) setOpCosts(await res.json())
  }

  async function saveOpCost(id: string, value: number) {
    setSavingCost(id)
    await fetch('/api/admin/finance/costs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, monthly_usd: value }),
    })
    setSavingCost(null)
    // Refresh overview to reflect new costs
    const params = month ? `?month=${encodeURIComponent(month)}` : ''
    const res = await fetch(`/api/admin/finance/overview${params}`)
    if (res.ok) setData(await res.json())
  }

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
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-teal/30 border-t-[#0EA5A3]" />
      </div>
    )
  }

  const { summary, users, planGoldenRecord = [], operationalCosts: apiOpCosts = [] } = data
  const periodLabel = summary.periodStart && summary.periodEnd && summary.periodStart !== summary.periodEnd
    ? `${summary.periodStart} a ${summary.periodEnd}`
    : summary.periodStart ?? new Date().toISOString().slice(0, 7)

  const infraEntries = Object.entries(summary.infraCosts).filter(
    ([, v]) => v > 0,
  ) as [keyof InfraCosts, number][]

  const marginPct = summary.totalRevenueCurrentMonthUsd > 0
    ? ((summary.netProfitUsd / summary.totalRevenueCurrentMonthUsd) * 100).toFixed(0)
    : '0'

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {[
          { label: 'Este mes', value: 1 },
          { label: '3 meses', value: 3 },
          { label: '6 meses', value: 6 },
          { label: '12 meses', value: 12 },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setRangeMonths(opt.value); setMonth('') }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              rangeMonths === opt.value && !month
                ? 'bg-brand-primary text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <input
          type="month"
          value={month}
          onChange={(e) => { setMonth(e.target.value || ''); setRangeMonths(1) }}
          className="ml-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
        />
      </div>

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

      {/* P&L Panel */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 bg-[#F8FAFC] px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
          <h3 className="font-display text-sm font-bold text-brand-primary dark:text-white">
            P&L del Mes
          </h3>
          <p className="mt-0.5 text-[11px] text-brand-muted">
            Costos operativos vs ingresos — {periodLabel}
          </p>
        </div>

        <div className="p-6">
          {/* Two-column: Revenue (left) vs Costs (right) */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: Revenue */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Ingresos</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm dark:bg-emerald-900/30">💳</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Suscripciones</p>
                    <p className="text-[11px] text-gray-400">{summary.ownerView?.activePayingUsers ?? 0} usuario{(summary.ownerView?.activePayingUsers ?? 0) !== 1 ? 's' : ''} pagando</p>
                  </div>
                  <span className="text-base font-bold tabular-nums text-gray-900 dark:text-white">{formatUsd(summary.totalPlanRevenueUsd ?? 0)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-sm dark:bg-purple-900/30">💎</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Creditos extra</p>
                    <p className="text-[11px] text-gray-400">Top-ups del mes</p>
                  </div>
                  <span className="text-base font-bold tabular-nums text-gray-900 dark:text-white">{formatUsd(summary.totalCreditRevenueUsd ?? 0)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm dark:bg-amber-900/30">👥</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Trial</p>
                    <p className="text-[11px] text-gray-400">Pendientes de conversion</p>
                  </div>
                  <span className="text-base font-bold tabular-nums text-gray-500 dark:text-gray-400">{summary.ownerView?.trialUsers ?? 0}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-5 py-3.5 dark:bg-emerald-900/10">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Total ingresos</span>
                <span className="font-display text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{formatUsd(summary.totalRevenueCurrentMonthUsd)}</span>
              </div>
            </div>

            {/* Right: Costs */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">Costos</p>
                <button
                  onClick={() => { void loadOpCosts(); setEditingCosts(!editingCosts) }}
                  className="text-[11px] font-medium text-brand-teal hover:underline"
                >
                  {editingCosts ? 'Cerrar' : 'Editar costos'}
                </button>
              </div>
              <div className="space-y-3">
                {apiOpCosts.map((cost) => (
                  <div key={cost.id} className={`flex items-center gap-3 ${cost.monthlyUsd > 0 ? '' : 'opacity-40'}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm dark:bg-gray-800">
                      {cost.id === 'supabase' ? '🗄️' : cost.id === 'vercel' ? '▲' : cost.id === 'domain' ? '🌐' : cost.id === 'sentry' ? '🔍' : cost.id === 'resend' ? '✉️' : cost.id === 'github' ? '📦' : cost.id === 'stripe' ? '💳' : cost.id === 'claude_code' ? '💻' : cost.id === 'anthropic_platform' ? '🤖' : '⚙️'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cost.label}</p>
                      <p className="text-[11px] text-gray-400">{cost.description}</p>
                    </div>
                    <span className="text-base font-bold tabular-nums text-gray-900 dark:text-white">{formatUsd(cost.monthlyUsd)}</span>
                  </div>
                ))}
                {/* IA variable cost (automatic) */}
                <div className="flex items-center gap-3 rounded-xl bg-brand-teal/5 px-3 py-2 dark:bg-brand-primary/10">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-sm">🤖</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-primary dark:text-brand-teal">IA producto</p>
                    <p className="text-[11px] text-gray-400">Consumo de tus usuarios (automatico)</p>
                  </div>
                  <span className="text-base font-bold tabular-nums text-brand-primary dark:text-brand-teal">{formatUsd(summary.totalCostCurrentMonthUsd)}</span>
                </div>
              </div>
              {/* Inline edit form */}
              {editingCosts && opCosts.length > 0 && (
                <div className="mt-3 rounded-xl border border-brand-teal/20 bg-brand-teal/5 p-4 dark:bg-brand-primary/10">
                  <p className="mb-3 text-xs font-semibold text-brand-primary dark:text-brand-teal">Editar costos mensuales</p>
                  <div className="space-y-2">
                    {opCosts.map((cost) => (
                      <div key={cost.id} className="flex items-center gap-3">
                        <span className="min-w-[100px] text-xs text-gray-600 dark:text-gray-400">{cost.label}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={cost.monthly_usd}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              if (val !== cost.monthly_usd) void saveOpCost(cost.id, val)
                            }}
                            className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-right text-xs tabular-nums dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                        </div>
                        {savingCost === cost.id && <span className="text-[10px] text-brand-teal">Guardando...</span>}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-gray-400">Cambia el valor y haz clic fuera para guardar. Se actualiza el P&L automaticamente.</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 px-5 py-3.5 dark:bg-red-900/10">
                <span className="text-sm font-bold text-red-700 dark:text-red-400">Total costos</span>
                <span className="font-display text-xl font-bold tabular-nums text-red-700 dark:text-red-400">{formatUsd(summary.totalCostsUsd)}</span>
              </div>
            </div>
          </div>

          {/* Result card — full width */}
          <div className={`mt-6 flex items-center justify-between rounded-xl px-6 py-5 ${
            summary.netProfitUsd >= 0
              ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 dark:from-emerald-900/10 dark:to-emerald-900/5 dark:border-emerald-800/30'
              : 'bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 dark:from-red-900/10 dark:to-red-900/5 dark:border-red-800/30'
          }`}>
            <div>
              <p className={`font-display text-base font-bold ${summary.netProfitUsd >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                {summary.netProfitUsd >= 0 ? 'Profit del mes' : 'Deficit del mes'}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">Ingresos - Costos operativos</p>
            </div>
            <span className={`font-display text-3xl font-bold tabular-nums ${summary.netProfitUsd >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
              {summary.netProfitUsd < 0 && '-'}{formatUsd(Math.abs(summary.netProfitUsd))}
            </span>
          </div>

          {/* Breakeven bar */}
          {summary.ownerView && (
            <div className="mt-6 rounded-xl border border-gray-100 bg-[#F8FAFC] px-5 py-4 dark:border-gray-800 dark:bg-gray-800/30">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-gray-600 dark:text-gray-300">Breakeven</span>
                <span className="text-gray-400">
                  Necesitas <strong className="text-gray-600 dark:text-gray-300">{summary.ownerView.breakEvenUsers} Starter</strong> para cubrir costos
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    summary.totalRevenueCurrentMonthUsd >= summary.totalCostsUsd ? 'bg-emerald-500' : 'bg-brand-amber'
                  }`}
                  style={{ width: `${Math.min(100, summary.totalCostsUsd > 0 ? (summary.totalRevenueCurrentMonthUsd / summary.totalCostsUsd) * 100 : 0)}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
                <span>{formatUsd(summary.totalRevenueCurrentMonthUsd)} de {formatUsd(summary.totalCostsUsd)}</span>
                <span>{Math.round(summary.totalCostsUsd > 0 ? (summary.totalRevenueCurrentMonthUsd / summary.totalCostsUsd) * 100 : 0)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Golden Record por Plan */}
      {planGoldenRecord.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Golden Record — Costo real vs presupuesto por plan
              </h3>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                Presupuesto = 30% del precio del plan. Meta: margen bruto ≥ 70%
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Plan', 'Precio', 'Presupuesto IA/usuario', 'Costo promedio real', 'Uso del presupuesto', 'Usuarios sobre límite', 'Riesgo'].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {planGoldenRecord.map((gr) => {
                  const barColor =
                    gr.budgetUsedPct >= 100 ? 'bg-red-500' :
                    gr.budgetUsedPct >= 80  ? 'bg-amber-500' :
                    gr.budgetUsedPct >= 50  ? 'bg-yellow-400' :
                    'bg-emerald-500'
                  const pctColor =
                    gr.budgetUsedPct >= 100 ? 'text-red-600 dark:text-red-400' :
                    gr.budgetUsedPct >= 80  ? 'text-amber-600 dark:text-amber-400' :
                    'text-emerald-600 dark:text-emerald-400'

                  return (
                    <tr key={gr.plan} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full bg-brand-surface dark:bg-brand-primary/30 px-2.5 py-0.5 text-[11px] font-bold text-brand-primary dark:text-brand-teal uppercase">
                          {gr.plan}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">{gr.activeUsersOnPlan} activos</span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                        {gr.planPriceUsd > 0 ? formatUsd(gr.planPriceUsd) : 'Custom'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 tabular-nums">
                        {formatUsd(gr.monthlyBudgetUsd)}
                      </td>
                      <td className="py-3 pr-4 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                        {formatUsd(gr.avgCostPerUserUsd)}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className={`h-full rounded-full transition-all ${barColor}`}
                              style={{ width: `${Math.min(100, gr.budgetUsedPct)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold tabular-nums ${pctColor}`}>
                            {gr.budgetUsedPct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {gr.usersAboveBudget > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                            🐋 {gr.usersAboveBudget} whale{gr.usersAboveBudget > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        {gr.atRisk ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                            ⚠️ En riesgo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            ✓ OK
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0EA5A3] to-[#0EA5A3] text-[11px] font-bold text-white shadow-sm shrink-0">
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
                      <span className="inline-flex rounded-full bg-brand-surface dark:bg-brand-primary/30 px-2.5 py-0.5 text-[11px] font-bold text-brand-primary dark:text-brand-teal uppercase">
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
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#0F2B46] to-[#0EA5A3] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm shadow-[#0EA5A3]/25 transition-all hover:shadow-md hover:shadow-[#0EA5A3]/30 hover:brightness-110"
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
