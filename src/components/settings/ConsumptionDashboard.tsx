'use client'

import { useEffect, useState } from 'react'
import { QuotaExceededModal } from '@/components/shared/QuotaExceededModal'

type CategoryRow = {
  id: string
  label: string
  cost: number
  calls: number
  inputTokens: number
  outputTokens: number
  pct: number
}

type MonthRow = {
  month: string
  costUsd: number
  events: number
}

type CreditRow = {
  id: string
  amountUsd: number
  priceUsd: number
  month: string
  createdAt: string
}

type QuotaInfo = {
  usedUsd: number
  budgetUsd: number
  creditsUsd: number
  effectiveBudgetUsd: number
  usedPct: number
  status: 'ok' | 'warning' | 'exceeded' | 'whale'
  plan: string
  canTopUp: boolean
}

type ConsumptionData = {
  quota: QuotaInfo
  currentMonth: string
  categories: CategoryRow[]
  monthlyHistory: MonthRow[]
  creditPurchases: CreditRow[]
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', builder: 'Builder', agency: 'Agency', enterprise: 'Enterprise',
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  ok: { color: 'text-brand-teal', bg: 'bg-brand-teal', label: 'Normal' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-400', label: 'Cerca del limite' },
  exceeded: { color: 'text-orange-600', bg: 'bg-orange-500', label: 'Limite alcanzado' },
  whale: { color: 'text-red-600', bg: 'bg-red-500', label: 'Excedido' },
}

const CATEGORY_COLORS: Record<string, string> = {
  chat: 'bg-brand-teal', build: 'bg-brand-primary', docs: 'bg-blue-500',
  testing: 'bg-green-500', infra: 'bg-purple-500', deploy: 'bg-amber-500',
  design: 'bg-pink-500', analysis: 'bg-indigo-500', other: 'bg-gray-400',
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
}

export function ConsumptionDashboard() {
  const [data, setData] = useState<ConsumptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTopUp, setShowTopUp] = useState(false)

  function fetchData() {
    setLoading(true)
    fetch('/api/user/consumption')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ConsumptionData | null) => setData(d))
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
        </div>
      </section>
    )
  }

  if (!data) return null

  const { quota, categories, monthlyHistory, creditPurchases, currentMonth } = data
  const statusCfg = STATUS_CONFIG[quota.status] ?? STATUS_CONFIG.ok
  const pct = Math.min(100, quota.usedPct)
  const maxMonthCost = Math.max(...monthlyHistory.map((m) => m.costUsd), 1)

  return (
    <>
      <section id="consumption" className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-100">
            Consumo de IA
          </h2>
          <span className="text-xs text-gray-400">{currentMonth}</span>
        </div>

        {/* ── Budget meter ──────────────────────────────────────────── */}
        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-display font-bold text-brand-primary dark:text-white">
                ${quota.usedUsd.toFixed(2)}
                <span className="ml-1 text-sm font-normal text-gray-400">
                  / ${quota.effectiveBudgetUsd.toFixed(2)}
                </span>
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {PLAN_LABELS[quota.plan]} — Budget mensual
                </span>
                {quota.creditsUsd > 0 && (
                  <span className="rounded bg-brand-teal/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-teal">
                    +${quota.creditsUsd.toFixed(0)} creditos
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusCfg.color} bg-opacity-10`}>
                {statusCfg.label}
              </span>
              <p className="mt-1 text-xl font-bold tabular-nums text-gray-900 dark:text-white">
                {quota.usedPct}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-700 ${statusCfg.bg}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Budget breakdown */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
            <span>$0</span>
            <span>Budget: ${quota.budgetUsd.toFixed(2)}{quota.creditsUsd > 0 ? ` + $${quota.creditsUsd.toFixed(0)} creditos` : ''}</span>
          </div>

          {/* CTA when exceeded */}
          {quota.canTopUp && (quota.status === 'exceeded' || quota.status === 'whale') && (
            <button
              onClick={() => setShowTopUp(true)}
              className="mt-3 w-full rounded-lg bg-brand-primary py-2 text-sm font-medium text-white hover:bg-brand-navy"
            >
              Comprar creditos para seguir construyendo
            </button>
          )}
        </div>

        {/* ── Category breakdown ────────────────────────────────────── */}
        {categories.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Desglose este mes
            </h3>
            <div className="mt-3 space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_COLORS[cat.id] ?? CATEGORY_COLORS.other}`} />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-600 dark:text-gray-400">
                    {cat.label}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">{cat.calls} ops</span>
                  <span className="w-16 shrink-0 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                    ${cat.cost.toFixed(2)}
                  </span>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-gray-400">
                    {cat.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Monthly history (mini bar chart) ─────────────────────── */}
        {monthlyHistory.length > 1 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Historial mensual
            </h3>
            <div className="mt-3 flex items-end gap-1.5" style={{ height: 80 }}>
              {monthlyHistory.map((m) => {
                const barH = Math.max(4, (m.costUsd / maxMonthCost) * 72)
                const isCurrent = m.month === currentMonth
                return (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[9px] tabular-nums text-gray-400">
                      ${m.costUsd.toFixed(0)}
                    </span>
                    <div
                      className={`w-full rounded-t ${isCurrent ? 'bg-brand-teal' : 'bg-gray-200 dark:bg-gray-700'}`}
                      style={{ height: barH }}
                    />
                    <span className="text-[9px] text-gray-400">
                      {MONTH_LABELS[m.month.slice(5)] ?? m.month.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Credit purchases ─────────────────────────────────────── */}
        {creditPurchases.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Creditos comprados
            </h3>
            <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
              {creditPurchases.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      +${c.amountUsd} de creditos IA
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                    ${c.priceUsd.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {showTopUp && (
        <QuotaExceededModal
          usedPct={quota.usedPct}
          budgetUsd={quota.effectiveBudgetUsd}
          plan={quota.plan}
          onClose={() => setShowTopUp(false)}
          onTopUpComplete={() => {
            setShowTopUp(false)
            fetchData()
          }}
        />
      )}
    </>
  )
}
