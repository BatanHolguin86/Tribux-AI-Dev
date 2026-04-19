'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import type { CostSummary } from '@/app/api/projects/[id]/costs/route'

// ── Infra service tiers ───────────────────────────────────────────────────────

type InfraTier = { label: string; monthlyUsd: number }
type InfraService = { label: string; tiers: Record<string, InfraTier>; defaultTier: string }

const INFRA_SERVICES: Record<string, InfraService> = {
  github: {
    label: 'GitHub',
    defaultTier: 'free',
    tiers: {
      free:       { label: 'Free',                   monthlyUsd: 0  },
      teams:      { label: 'Teams ($4/usuario)',      monthlyUsd: 4  },
      enterprise: { label: 'Enterprise ($21/usuario)',monthlyUsd: 21 },
    },
  },
  supabase: {
    label: 'Supabase',
    defaultTier: 'free',
    tiers: {
      free:  { label: 'Free',  monthlyUsd: 0   },
      pro:   { label: 'Pro',   monthlyUsd: 25  },
      teams: { label: 'Teams', monthlyUsd: 599 },
    },
  },
  vercel: {
    label: 'Vercel',
    defaultTier: 'hobby',
    tiers: {
      hobby:      { label: 'Hobby (Free)', monthlyUsd: 0  },
      pro:        { label: 'Pro',          monthlyUsd: 20 },
      enterprise: { label: 'Enterprise (custom)', monthlyUsd: 0 },
    },
  },
  sentry: {
    label: 'Sentry',
    defaultTier: 'free',
    tiers: {
      free:     { label: 'Developer (Free)', monthlyUsd: 0  },
      team:     { label: 'Team',             monthlyUsd: 26 },
      business: { label: 'Business',         monthlyUsd: 80 },
    },
  },
}

function computeInfraMonthly(tiers: Record<string, string>): number {
  return Object.entries(INFRA_SERVICES).reduce((sum, [id, svc]) => {
    const tierKey = tiers[id] ?? svc.defaultTier
    return sum + (svc.tiers[tierKey]?.monthlyUsd ?? 0)
  }, 0)
}

// ── Format helpers ────────────────────────────────────────────────────────────

function fmtUSD(n: number): string {
  if (n === 0) return '$0.00'
  if (n < 0.01) return '<$0.01'
  return `$${n.toFixed(2)}`
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

function fmtMonth(m: string): string {
  const [y, mo] = m.split('-')
  const date = new Date(Number(y), Number(mo) - 1, 1)
  return date.toLocaleDateString('es', { month: 'short', year: 'numeric' })
}

function isCurrentMonth(m: string): boolean {
  const now = new Date()
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return m === current
}

// ── Category color ────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  chat:   'bg-brand-teal',
  code:   'bg-blue-500',
  tests:  'bg-emerald-500',
  data:   'bg-amber-500',
  docs:   'bg-brand-teal',
  deploy: 'bg-orange-500',
  growth: 'bg-pink-500',
}

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = React.memo(function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-brand-teal/30 bg-brand-surface dark:border-[#0A1F33]/40 dark:bg-brand-primary/10' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-display font-bold tabular-nums ${highlight ? 'text-brand-primary dark:text-brand-teal' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
})

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{children}</h2>
  )
}

// ── Bloque 1: Summary Header ──────────────────────────────────────────────────

const SummaryHeader = React.memo(function SummaryHeader({ data, infraMonthly }: { data: CostSummary; infraMonthly: number }) {
  const annualInfra = infraMonthly * 12
  const breakevenMsg = infraMonthly > 0
    ? `Para recuperar costos de operación, cobra ≥ ${fmtUSD(infraMonthly)}/mes a tu cliente`
    : 'Configura los tiers de infraestructura para calcular el punto de equilibrio'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">💰</span>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Costo total de construir este producto</h2>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard
          label="Desarrollo AI (total)"
          value={fmtUSD(data.aiCostAllTime)}
          sub={`${data.totalEventCount} acciones · ${fmtTokens(data.totalInputTokens + data.totalOutputTokens)} tokens`}
          highlight
        />
        <StatCard
          label="Infraestructura /mes"
          value={fmtUSD(infraMonthly)}
          sub={infraMonthly > 0 ? `${fmtUSD(annualInfra)}/año` : 'Configura los tiers abajo'}
        />
        <StatCard
          label="Costo operativo /año"
          value={infraMonthly > 0 ? fmtUSD(annualInfra) : '—'}
          sub="Proyección basada en tiers configurados"
        />
      </div>

      <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs ${
        infraMonthly > 0 ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
      }`}>
        <span className="mt-0.5 shrink-0">{infraMonthly > 0 ? '📊' : 'ℹ️'}</span>
        <span>{breakevenMsg}</span>
      </div>
    </div>
  )
})

// ── Bloque 2a: Plan budget bar ────────────────────────────────────────────────

function PlanUsageBar({ data, projectId }: { data: CostSummary; projectId: string }) {
  const totalMonthly = data.thisMonthAllProjects.reduce((s, p) => s + p.costUsd, 0)
  const thisProject = data.thisMonthAllProjects.find((p) => p.projectId === projectId)
  const thisProjectCost = thisProject?.costUsd ?? 0
  const otherCost = totalMonthly - thisProjectCost
  const remaining = Math.max(0, data.planBudgetUsd - totalMonthly)
  const usedPct = data.planBudgetUsd > 0 ? Math.min(100, (totalMonthly / data.planBudgetUsd) * 100) : 0
  const thisPct = data.planBudgetUsd > 0 ? Math.min(100, (thisProjectCost / data.planBudgetUsd) * 100) : 0
  const otherPct = data.planBudgetUsd > 0 ? Math.min(100, (otherCost / data.planBudgetUsd) * 100) : 0

  const planLabel = { starter: 'Starter', builder: 'Builder', pro: 'Pro', agency: 'Agency', enterprise: 'Enterprise' }[data.plan] ?? data.plan

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 mb-6">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>Consumo del plan este mes</SectionTitle>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Plan <span className="text-brand-primary dark:text-brand-teal font-semibold">{planLabel}</span> · {fmtUSD(data.planBudgetUsd)}/mes
        </span>
      </div>

      {/* Stacked progress bar */}
      <div className="mb-3 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex">
        {thisPct > 0 && (
          <div className="h-full bg-brand-teal transition-all duration-700" style={{ width: `${thisPct}%` }} title={`Este proyecto: ${fmtUSD(thisProjectCost)}`} />
        )}
        {otherPct > 0 && (
          <div className="h-full bg-gray-400 dark:bg-gray-600 transition-all duration-700" style={{ width: `${otherPct}%` }} title={`Otros proyectos: ${fmtUSD(otherCost)}`} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-teal" />
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Este proyecto</p>
            <p className="text-gray-400">{fmtUSD(thisProjectCost)} · {Math.round(thisPct)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-400 dark:bg-gray-600" />
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Otros proyectos</p>
            <p className="text-gray-400">{fmtUSD(otherCost)} · {Math.round(otherPct)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-600" />
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Disponible</p>
            <p className={remaining === 0 ? 'text-rose-500 font-medium' : 'text-gray-400'}>
              {fmtUSD(remaining)} · {Math.round(100 - usedPct)}%
            </p>
          </div>
        </div>
      </div>

      {usedPct >= 80 && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${
          usedPct >= 100
            ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
        }`}>
          {usedPct >= 100
            ? `⚠️ Presupuesto superado — se generará cargo adicional por ${fmtUSD(totalMonthly - data.planBudgetUsd)}`
            : `⚠️ ${Math.round(usedPct)}% del budget consumido — quedan ${fmtUSD(remaining)}`}
        </div>
      )}

      {data.overage?.hasOverage && (
        <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
          💳 Cargo por overage pendiente: <span className="font-semibold">{fmtUSD(data.overage.amountUsd)}</span> ({data.overage.status})
        </div>
      )}
    </div>
  )
}

// ── Bloque 2b: Action breakdown ───────────────────────────────────────────────

const ActionBreakdown = React.memo(function ActionBreakdown({ data }: { data: CostSummary }) {
  if (data.byCategory.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <SectionTitle>Desglose por tipo de acción</SectionTitle>
        <p className="text-sm text-gray-400 dark:text-gray-500">Sin actividad registrada aún en este proyecto.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <SectionTitle>Desglose por tipo de acción (todo el tiempo)</SectionTitle>
      <div className="space-y-2.5">
        {data.byCategory.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${CAT_COLORS[cat.id] ?? 'bg-gray-400'}`} />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
                <span className="text-[10px] text-gray-400">{cat.calls} llamadas</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-400">{fmtTokens(cat.inputTokens + cat.outputTokens)} uds</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums w-14 text-right">{fmtUSD(cat.costUsd)}</span>
                <span className="text-gray-400 w-8 text-right">{cat.pct}%</span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-1.5 rounded-full ${CAT_COLORS[cat.id] ?? 'bg-gray-400'} transition-all duration-500`}
                style={{ width: `${cat.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 dark:border-gray-800 text-xs">
        <span className="text-gray-400">{fmtTokens(data.totalInputTokens + data.totalOutputTokens)} unidades de IA procesadas</span>
        <span className="font-bold text-gray-900 dark:text-gray-100">{fmtUSD(data.aiCostAllTime)} total AI</span>
      </div>
    </div>
  )
})

// ── Bloque 3: Infra config ────────────────────────────────────────────────────

function InfraConfig({
  projectId,
  infraTiers,
  onChange,
}: {
  projectId: string
  infraTiers: Record<string, string>
  onChange: (tiers: Record<string, string>) => void
}) {
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  async function handleChange(serviceId: string, tier: string) {
    const newTiers = { ...infraTiers, [serviceId]: tier }
    onChange(newTiers)
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}/costs/infra-tiers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTiers),
      })
      setSavedAt(new Date())
    } catch { /* non-fatal */ }
    finally { setSaving(false) }
  }

  const monthly = computeInfraMonthly(infraTiers)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>Infraestructura mensual</SectionTitle>
        {saving && <span className="text-[10px] text-gray-400">Guardando…</span>}
        {!saving && savedAt && <span className="text-[10px] text-emerald-500">✓ Guardado</span>}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 leading-relaxed">
        Selecciona el plan que usas en cada servicio para estimar tu costo operativo mensual.
      </p>

      <div className="space-y-2.5">
        {Object.entries(INFRA_SERVICES).map(([id, svc]) => {
          const currentTier = infraTiers[id] ?? svc.defaultTier
          const tierData = svc.tiers[currentTier]
          return (
            <div key={id} className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-20 shrink-0">{svc.label}</span>
              <select
                value={currentTier}
                onChange={(e) => handleChange(id, e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-[#0EA5A3] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {Object.entries(svc.tiers).map(([key, t]) => (
                  <option key={key} value={key}>{t.label}</option>
                ))}
              </select>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums w-12 text-right shrink-0">
                {tierData?.monthlyUsd === 0 ? 'Gratis' : `$${tierData?.monthlyUsd}/mes`}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total mensual</p>
          <p className="text-xl font-display font-bold tabular-nums text-gray-900 dark:text-gray-100">{fmtUSD(monthly)}<span className="text-xs font-normal text-gray-400 ml-1">/mes</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Proyección anual</p>
          <p className="text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-300">{fmtUSD(monthly * 12)}/año</p>
        </div>
      </div>
    </div>
  )
}

// ── Bloque 4: Monthly history ─────────────────────────────────────────────────

const MonthlyHistory = React.memo(function MonthlyHistory({ data, infraMonthly }: { data: CostSummary; infraMonthly: number }) {
  if (data.monthlyHistory.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <SectionTitle>Historial desde el inicio del proyecto</SectionTitle>
        <p className="text-sm text-gray-400 dark:text-gray-500">Sin actividad registrada aún.</p>
      </div>
    )
  }

  const rows = data.monthlyHistory.reduce<Array<{ month: string; aiCostUsd: number; eventCount: number; infraCost: number; total: number; cumulative: number }>>((acc, m) => {
    const total = m.aiCostUsd + infraMonthly
    const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0
    acc.push({ ...m, infraCost: infraMonthly, total, cumulative: prev + total })
    return acc
  }, [])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <SectionTitle>Historial desde el inicio del proyecto</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="pb-2 text-left font-medium text-gray-400">Mes</th>
              <th className="pb-2 text-right font-medium text-gray-400">Tribux AI</th>
              <th className="pb-2 text-right font-medium text-gray-400">Infra est.</th>
              <th className="pb-2 text-right font-medium text-gray-400">Total mes</th>
              <th className="pb-2 text-right font-medium text-gray-400">Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {rows.map((row) => {
              const isCurrent = isCurrentMonth(row.month)
              return (
                <tr key={row.month} className={isCurrent ? 'bg-brand-surface/50 dark:bg-brand-primary/10' : ''}>
                  <td className="py-2 font-medium text-gray-700 dark:text-gray-300">
                    {fmtMonth(row.month)}
                    {isCurrent && (
                      <span className="ml-1.5 rounded bg-brand-surface px-1 py-0.5 text-[9px] font-semibold text-brand-primary dark:bg-brand-primary/30 dark:text-brand-teal uppercase tracking-wide">
                        en curso
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums text-brand-primary dark:text-brand-teal font-medium">{fmtUSD(row.aiCostUsd)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">{fmtUSD(row.infraCost)}</td>
                  <td className="py-2 text-right tabular-nums font-semibold text-gray-800 dark:text-gray-200">{fmtUSD(row.total)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">{fmtUSD(row.cumulative)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 dark:border-gray-700">
              <td className="pt-2 font-semibold text-gray-700 dark:text-gray-300">Total</td>
              <td className="pt-2 text-right tabular-nums font-semibold text-brand-primary dark:text-brand-teal">{fmtUSD(data.aiCostAllTime)}</td>
              <td className="pt-2 text-right tabular-nums text-gray-500">—</td>
              <td className="pt-2 text-right tabular-nums font-bold text-gray-900 dark:text-gray-100">{fmtUSD(rows[rows.length - 1]?.cumulative ?? 0)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
})

// ── Bloque 5: P&L + Pricing sugerido ─────────────────────────────────────

const ProjectPnL = React.memo(function ProjectPnL({
  data,
  infraMonthly,
}: {
  data: CostSummary
  infraMonthly: number
}) {
  // Calculate project duration in months
  const startDate = new Date(data.projectCreatedAt)
  const now = new Date()
  const monthsActive = Math.max(1, Math.ceil(
    (now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000),
  ))

  // Prorate subscription cost to this project
  const totalProjects = Math.max(1, data.thisMonthAllProjects.length)
  const subscriptionPerProject = data.planPriceUsd / totalProjects
  const subscriptionTotal = subscriptionPerProject * monthsActive

  // Total infrastructure cost over project lifetime
  const infraTotal = infraMonthly * monthsActive

  // Total investment
  const totalInvestment = data.aiCostAllTime + subscriptionTotal + infraTotal

  // Ongoing monthly cost
  const ongoingMonthly = infraMonthly + (data.aiCostThisMonth > 0 ? subscriptionPerProject : 0)

  // Markup tiers
  const markups = [
    { label: 'Minimo (2×)', factor: 2, desc: 'Cubre costos + margen basico' },
    { label: 'Competitivo (3×)', factor: 3, desc: 'Estandar de agencias' },
    { label: 'Premium (5×)', factor: 5, desc: 'Producto de alto valor' },
  ]

  return (
    <div className="rounded-xl border-2 border-brand-primary/10 bg-gradient-to-b from-white to-gray-50/50 p-5 dark:border-brand-teal/10 dark:from-gray-900 dark:to-gray-900/50">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">📊</span>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">P&L del Proyecto — Cuanto cobrar</h2>
      </div>

      {/* Investment breakdown */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Inversion total</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Desarrollo IA (tokens consumidos)</span>
            <span className="font-medium tabular-nums text-gray-900 dark:text-white">{fmtUSD(data.aiCostAllTime)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Suscripcion Tribux AI ({monthsActive} {monthsActive === 1 ? 'mes' : 'meses'}, prorrateado {totalProjects > 1 ? `1/${totalProjects} proyectos` : ''})
            </span>
            <span className="font-medium tabular-nums text-gray-900 dark:text-white">{fmtUSD(subscriptionTotal)}</span>
          </div>
          {infraTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Infraestructura ({monthsActive} meses × {fmtUSD(infraMonthly)})</span>
              <span className="font-medium tabular-nums text-gray-900 dark:text-white">{fmtUSD(infraTotal)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
            <span className="text-sm font-semibold text-brand-primary dark:text-brand-teal">Total invertido</span>
            <span className="text-lg font-display font-bold tabular-nums text-brand-primary dark:text-brand-teal">{fmtUSD(totalInvestment)}</span>
          </div>
        </div>
      </div>

      {/* Suggested pricing */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Precio sugerido al cliente</p>
        <div className="grid grid-cols-3 gap-2">
          {markups.map((m) => {
            const price = totalInvestment * m.factor
            return (
              <div key={m.factor} className={`rounded-lg border p-3 text-center ${
                m.factor === 3
                  ? 'border-brand-teal/30 bg-brand-surface dark:bg-brand-primary/20'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              }`}>
                <p className="text-lg font-display font-bold tabular-nums text-brand-primary dark:text-white">
                  {fmtUSD(price)}
                </p>
                <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{m.label}</p>
                <p className="text-[10px] text-gray-400">{m.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ongoing costs */}
      {ongoingMonthly > 0 && (
        <div className="rounded-lg bg-gray-100/80 px-4 py-3 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Costo operativo mensual</p>
              <p className="text-[11px] text-gray-400">Lo que cuesta mantener este producto corriendo</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-display font-bold tabular-nums text-gray-900 dark:text-white">{fmtUSD(ongoingMonthly)}<span className="text-xs font-normal text-gray-400">/mes</span></p>
              <p className="text-[10px] text-gray-400">Cobra al menos esto como fee mensual</p>
            </div>
          </div>
        </div>
      )}

      {/* ROI note */}
      <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-400">
        <span className="mt-0.5">💡</span>
        <span>
          Con un precio de venta de {fmtUSD(totalInvestment * 3)} y operacion de {fmtUSD(ongoingMonthly)}/mes,
          tu proyecto se paga desde el primer cobro y genera {fmtUSD(totalInvestment * 3 - totalInvestment)} de ganancia.
        </span>
      </div>
    </div>
  )
})

// ── Main component ────────────────────────────────────────────────────────────

export function ProjectCostDashboard({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const [data, setData] = useState<CostSummary | null>(null)
  const [infraTiers, setInfraTiers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/costs`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const summary: CostSummary = await res.json()
      setData(summary)
      setInfraTiers(summary.infraTiers)
      setLastChecked(new Date())
    } catch {
      setError('No se pudo cargar los datos de costos')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchData() }, [fetchData])

  const infraMonthly = useMemo(() => computeInfraMonthly(infraTiers), [infraTiers])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">Control de Costos</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pipeline financiero de{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{projectName}</span>
            {' '}— cuánto costó construirlo y cuánto cuesta operarlo.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
          {lastChecked && !loading && (
            <span className="text-[10px] text-gray-400 dark:text-gray-600">
              Actualizado {lastChecked.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      )}

      {data && (
        <>
          <ProjectPnL data={data} infraMonthly={infraMonthly} />

          <div className="mt-4" />

          <SummaryHeader data={data} infraMonthly={infraMonthly} />
          <PlanUsageBar data={data} projectId={projectId} />

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <ActionBreakdown data={data} />
            <InfraConfig
              projectId={projectId}
              infraTiers={infraTiers}
              onChange={setInfraTiers}
            />
          </div>

          <MonthlyHistory data={data} infraMonthly={infraMonthly} />
        </>
      )}
    </div>
  )
}
