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
  const [fromMonth, setFromMonth] = useState<string>('')
  const [toMonth, setToMonth] = useState<string>('')
  const [editingCosts, setEditingCosts] = useState(false)
  const [opCosts, setOpCosts] = useState<OperationalCost[]>([])
  const [savingCost, setSavingCost] = useState<string | null>(null)
  const [editingInvestment, setEditingInvestment] = useState(false)
  const [newCostLabel, setNewCostLabel] = useState('')
  const [addingCost, setAddingCost] = useState<'operational' | 'investment' | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true)
      const params = new URLSearchParams()
      if (fromMonth) params.set('from', fromMonth)
      if (toMonth) params.set('to', toMonth)
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
  }, [fromMonth, toMonth])

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
    const p = new URLSearchParams()
    if (fromMonth) p.set('from', fromMonth)
    if (toMonth) p.set('to', toMonth)
    const res = await fetch(`/api/admin/finance/overview${p.toString() ? `?${p.toString()}` : ''}`)
    if (res.ok) setData(await res.json())
  }

  async function deleteCost(id: string) {
    await fetch('/api/admin/finance/costs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const p = new URLSearchParams()
    if (fromMonth) p.set('from', fromMonth)
    if (toMonth) p.set('to', toMonth)
    const res = await fetch(`/api/admin/finance/overview${p.toString() ? `?${p.toString()}` : ''}`)
    if (res.ok) setData(await res.json())
  }

  async function addNewCost(label: string, isInvestment: boolean) {
    if (!label.trim()) return
    const id = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const supabaseRes = await fetch('/api/admin/finance/costs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, monthly_usd: 0 }),
    })
    // If cost doesn't exist, need to insert via a different approach
    // Use the same endpoint but with upsert logic
    if (!supabaseRes.ok) {
      // Try creating it
      await fetch('/api/admin/finance/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label: label.trim(), description: isInvestment ? 'Inversion personal' : 'Costo operativo', monthly_usd: 0 }),
      })
    }
    // Refresh data
    const p = new URLSearchParams()
    if (fromMonth) p.set('from', fromMonth)
    if (toMonth) p.set('to', toMonth)
    const res = await fetch(`/api/admin/finance/overview${p.toString() ? `?${p.toString()}` : ''}`)
    if (res.ok) setData(await res.json())
    setNewCostLabel('')
    setAddingCost(null)
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

  // Separate operational costs (affect P&L) from founder investment (personal)
  const INVESTMENT_IDS = new Set(['claude_code'])
  const operationalItems = apiOpCosts.filter((c) => !INVESTMENT_IDS.has(c.id))
  const investmentItems = apiOpCosts.filter((c) => INVESTMENT_IDS.has(c.id))
  const totalOperationalFixed = operationalItems.reduce((s, c) => s + c.monthlyUsd, 0) * (summary.rangeMonths ?? 1)
  const totalInvestment = investmentItems.reduce((s, c) => s + c.monthlyUsd, 0) * (summary.rangeMonths ?? 1)
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
      <div className="flex flex-wrap items-center gap-3">
        {/* Presets */}
        {[
          { label: 'Este mes', from: '', to: '' },
          { label: '3 meses', from: (() => { const d = new Date(); d.setMonth(d.getMonth() - 2); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })(), to: '' },
          { label: '6 meses', from: (() => { const d = new Date(); d.setMonth(d.getMonth() - 5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })(), to: '' },
          { label: 'Todo', from: '2026-01', to: '' },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => { setFromMonth(opt.from); setToMonth(opt.to) }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              fromMonth === opt.from && toMonth === opt.to
                ? 'bg-brand-primary text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {/* Custom range */}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-[10px] text-gray-400">Desde</span>
          <input
            type="month"
            value={fromMonth}
            onChange={(e) => setFromMonth(e.target.value || '')}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
          />
          <span className="text-[10px] text-gray-400">Hasta</span>
          <input
            type="month"
            value={toMonth || new Date().toISOString().slice(0, 7)}
            onChange={(e) => setToMonth(e.target.value || '')}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
          />
        </div>
      </div>

      {/* KPI cards — operational only (no founder investment) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={formatUsd(summary.totalRevenueCurrentMonthUsd)}
          subtitle={`${summary.ownerView?.activePayingUsers ?? 0} pagando · ${summary.ownerView?.trialUsers ?? 0} trial`}
          variant="revenue"
        />
        <KpiCard
          label="Costo operativo"
          value={formatUsd(totalOperationalFixed + summary.totalCostCurrentMonthUsd)}
          subtitle={`IA ${formatUsd(summary.totalCostCurrentMonthUsd)} + Infra ${formatUsd(totalOperationalFixed)}`}
          variant="cost"
        />
        <KpiCard
          label="Profit operativo"
          value={formatUsd(summary.totalRevenueCurrentMonthUsd - totalOperationalFixed - summary.totalCostCurrentMonthUsd)}
          subtitle={`Margen: ${summary.totalRevenueCurrentMonthUsd > 0 ? Math.round(((summary.totalRevenueCurrentMonthUsd - totalOperationalFixed - summary.totalCostCurrentMonthUsd) / summary.totalRevenueCurrentMonthUsd) * 100) : 0}%`}
          variant="profit"
        />
        <KpiCard
          label="Tu inversion (personal)"
          value={formatUsd(totalInvestment)}
          subtitle={investmentItems.map((c) => c.label).join(', ') || 'Sin costos personales'}
        />
      </div>

      {/* P&L Panel */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 bg-[#F8FAFC] px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
          <h3 className="font-display text-sm font-bold text-brand-primary dark:text-white">
            P&L Operativo
          </h3>
          <p className="mt-0.5 text-[11px] text-brand-muted">
            Solo costos de operar Tribux (lo que pagas para que funcione el producto) — {periodLabel}
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
                  onClick={() => setEditingCosts(!editingCosts)}
                  className="text-[11px] font-medium text-brand-teal hover:underline"
                >
                  {editingCosts ? 'Listo' : 'Editar'}
                </button>
              </div>
              <div className="space-y-3">
                {operationalItems.map((cost) => {
                  const icon = cost.id === 'supabase' ? '🗄️' : cost.id === 'vercel' ? '▲' : cost.id === 'domain' ? '🌐' : cost.id === 'sentry' ? '🔍' : cost.id === 'resend' ? '✉️' : cost.id === 'github' ? '📦' : cost.id === 'stripe' ? '💳' : cost.id === 'anthropic_platform' ? '🤖' : '⚙️'
                  return (
                    <div key={cost.id} className={`flex items-center gap-3 ${cost.monthlyUsd > 0 ? '' : 'opacity-40'}`}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm dark:bg-gray-800">{icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cost.label}</p>
                        <p className="text-[11px] text-gray-400">{cost.description}</p>
                      </div>
                      {editingCosts ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={cost.monthlyUsd}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              if (val !== cost.monthlyUsd) void saveOpCost(cost.id, val)
                            }}
                            className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-right text-sm font-bold tabular-nums dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                          {savingCost === cost.id && <span className="text-[10px] text-brand-teal">✓</span>}
                          <button
                            onClick={() => { if (confirm(`Eliminar ${cost.label}?`)) void deleteCost(cost.id) }}
                            className="rounded p-1 text-gray-300 hover:text-red-500"
                            title="Eliminar"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-base font-bold tabular-nums text-gray-900 dark:text-white">{formatUsd(cost.monthlyUsd)}</span>
                      )}
                    </div>
                  )
                })}
                {/* Add new operational cost */}
                {editingCosts && (
                  addingCost === 'operational' ? (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 dark:border-gray-600 dark:bg-gray-800">
                      <input
                        type="text"
                        value={newCostLabel}
                        onChange={(e) => setNewCostLabel(e.target.value)}
                        placeholder="Nombre del servicio..."
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') void addNewCost(newCostLabel, false) }}
                      />
                      <button
                        onClick={() => void addNewCost(newCostLabel, false)}
                        disabled={!newCostLabel.trim()}
                        className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                      >
                        Agregar
                      </button>
                      <button onClick={() => { setAddingCost(null); setNewCostLabel('') }} className="text-xs text-gray-400">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingCost('operational')}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                    >
                      + Agregar costo operativo
                    </button>
                  )
                )}

                {/* IA variable cost (automatic — not editable) */}
                <div className="flex items-center gap-3 rounded-xl bg-brand-teal/5 px-3 py-2 dark:bg-brand-primary/10">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-sm">🤖</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-primary dark:text-brand-teal">IA producto</p>
                    <p className="text-[11px] text-gray-400">Automatico (ai_usage_events)</p>
                  </div>
                  <span className="text-base font-bold tabular-nums text-brand-primary dark:text-brand-teal">{formatUsd(summary.totalCostCurrentMonthUsd)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 px-5 py-3.5 dark:bg-red-900/10">
                <span className="text-sm font-bold text-red-700 dark:text-red-400">Total costos operativos</span>
                <span className="font-display text-xl font-bold tabular-nums text-red-700 dark:text-red-400">{formatUsd(totalOperationalFixed + summary.totalCostCurrentMonthUsd)}</span>
              </div>
            </div>
          </div>

          {/* Result card — full width */}
          {(() => {
            const opProfit = summary.totalRevenueCurrentMonthUsd - totalOperationalFixed - summary.totalCostCurrentMonthUsd
            return (
              <div className={`mt-6 flex items-center justify-between rounded-xl px-6 py-5 ${
                opProfit >= 0
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 dark:from-emerald-900/10 dark:to-emerald-900/5 dark:border-emerald-800/30'
                  : 'bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 dark:from-red-900/10 dark:to-red-900/5 dark:border-red-800/30'
              }`}>
                <div>
                  <p className={`font-display text-base font-bold ${opProfit >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                    {opProfit >= 0 ? 'Profit operativo' : 'Deficit operativo'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">Revenue - Costos de operar Tribux (sin tu inversion personal)</p>
                </div>
                <span className={`font-display text-3xl font-bold tabular-nums ${opProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                  {opProfit < 0 && '-'}{formatUsd(Math.abs(opProfit))}
                </span>
              </div>
            )
          })()}

          {/* Breakeven bar — operational only */}
          {(() => {
            const opTotal = totalOperationalFixed + summary.totalCostCurrentMonthUsd
            const opPct = opTotal > 0 ? (summary.totalRevenueCurrentMonthUsd / opTotal) * 100 : 0
            return (
              <div className="mt-6 rounded-xl border border-gray-100 bg-[#F8FAFC] px-5 py-4 dark:border-gray-800 dark:bg-gray-800/30">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Breakeven operativo</span>
                  <span className="text-gray-400">
                    {formatUsd(summary.totalRevenueCurrentMonthUsd)} de {formatUsd(opTotal)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${opPct >= 100 ? 'bg-emerald-500' : 'bg-brand-amber'}`}
                    style={{ width: `${Math.min(100, opPct)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
                  <span>$0</span>
                  <span>{Math.round(opPct)}%</span>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Founder Investment — SEPARATE from P&L */}
      <div className="rounded-xl border border-purple-200 bg-purple-50/30 dark:border-purple-800/30 dark:bg-purple-900/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <div>
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">Tu inversion personal</h3>
              <p className="text-[11px] text-purple-600/60 dark:text-purple-400/60">
                NO afecta el P&L operativo
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditingInvestment(!editingInvestment)}
            className="text-[11px] font-medium text-purple-600 hover:underline dark:text-purple-400"
          >
            {editingInvestment ? 'Listo' : 'Editar'}
          </button>
        </div>
        <div className="space-y-2">
          {investmentItems.map((cost) => (
            <div key={cost.id} className="flex items-center justify-between rounded-lg bg-white/60 px-4 py-2.5 dark:bg-gray-900/40">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-sm dark:bg-purple-900/30">💻</span>
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300">{cost.label}</p>
                  <p className="text-[10px] text-purple-600/60 dark:text-purple-400/60">{cost.description}</p>
                </div>
              </div>
              {editingInvestment ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-purple-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={cost.monthlyUsd}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value) || 0
                      if (val !== cost.monthlyUsd) void saveOpCost(cost.id, val)
                    }}
                    className="w-20 rounded-lg border border-purple-200 bg-white px-2 py-1.5 text-right text-sm font-bold tabular-nums dark:border-purple-800 dark:bg-gray-900 dark:text-white"
                  />
                  {savingCost === cost.id && <span className="text-[10px] text-purple-500">✓</span>}
                  <button
                    onClick={() => { if (confirm(`Eliminar ${cost.label}?`)) void deleteCost(cost.id) }}
                    className="rounded p-1 text-purple-300 hover:text-red-500"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <span className="text-base font-bold tabular-nums text-purple-800 dark:text-purple-300">{formatUsd(cost.monthlyUsd)}/mes</span>
              )}
            </div>
          ))}

          {/* Add new investment cost */}
          {editingInvestment && (
            addingCost === 'investment' ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-purple-300 bg-white/60 px-4 py-2.5 dark:border-purple-700 dark:bg-gray-900/40">
                <input
                  type="text"
                  value={newCostLabel}
                  onChange={(e) => setNewCostLabel(e.target.value)}
                  placeholder="Nombre del costo..."
                  className="flex-1 rounded-lg border border-purple-200 bg-white px-2 py-1.5 text-sm dark:border-purple-800 dark:bg-gray-900 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') void addNewCost(newCostLabel, true) }}
                />
                <button
                  onClick={() => void addNewCost(newCostLabel, true)}
                  disabled={!newCostLabel.trim()}
                  className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  Agregar
                </button>
                <button onClick={() => { setAddingCost(null); setNewCostLabel('') }} className="text-xs text-gray-400">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setAddingCost('investment')}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-purple-300 py-2 text-xs font-medium text-purple-500 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
              >
                + Agregar costo personal
              </button>
            )
          )}
        </div>

        {totalInvestment > 0 && (
          <div className="mt-3 rounded-lg bg-purple-100/50 px-4 py-2 text-[11px] text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
            Total: <strong>{formatUsd(totalInvestment)}/mes</strong> — Necesitas <strong>{Math.ceil(totalInvestment / 49)} usuarios Starter</strong> para cubrirlo.
          </div>
        )}
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
