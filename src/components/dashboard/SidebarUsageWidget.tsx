'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type QuotaData = {
  usedUsd: number
  budgetUsd: number
  creditsUsd: number
  effectiveBudgetUsd: number
  usedPct: number
  status: 'ok' | 'warning' | 'exceeded' | 'whale'
  plan: string
  canTopUp: boolean
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  builder: 'Builder',
  agency: 'Agency',
  enterprise: 'Enterprise',
}

const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-brand-teal',
  warning: 'bg-amber-400',
  exceeded: 'bg-orange-500',
  whale: 'bg-red-500',
}

export function SidebarUsageWidget() {
  const [quota, setQuota] = useState<QuotaData | null>(null)

  useEffect(() => {
    fetch('/api/user/quota')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: QuotaData | null) => setQuota(data))
      .catch(() => null)
  }, [])

  if (!quota) return null

  const barColor = STATUS_COLORS[quota.status] ?? STATUS_COLORS.ok
  const pct = Math.min(100, quota.usedPct)

  return (
    <div className="px-4 pb-3">
      <div className="rounded-lg bg-white/5 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
            Uso de IA
          </span>
          <span className="text-[10px] font-medium text-white/50">
            {PLAN_LABELS[quota.plan] ?? quota.plan}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Usage numbers */}
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xs font-semibold tabular-nums text-white/80">
            ${quota.usedUsd.toFixed(2)}
          </span>
          <span className="text-[10px] text-white/40">
            de ${quota.effectiveBudgetUsd.toFixed(2)}
          </span>
        </div>

        {/* Credits indicator */}
        {quota.creditsUsd > 0 && (
          <p className="mt-0.5 text-[10px] text-brand-teal/70">
            +${quota.creditsUsd.toFixed(0)} creditos extra
          </p>
        )}

        {/* Status actions */}
        {quota.status === 'exceeded' || quota.status === 'whale' ? (
          <Link
            href="/settings?upgrade=true"
            className="mt-1.5 flex items-center justify-center gap-1 rounded-md bg-brand-amber/20 px-2 py-1 text-[10px] font-medium text-brand-amber transition-colors hover:bg-brand-amber/30"
          >
            Comprar creditos
          </Link>
        ) : quota.status === 'warning' ? (
          <p className="mt-1 text-[10px] text-amber-400/80">{quota.usedPct}% usado este mes</p>
        ) : null}
      </div>
    </div>
  )
}
