'use client'

import { useEffect, useState, useCallback } from 'react'
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
  pro: 'Pro',
  agency: 'Agency',
  enterprise: 'Enterprise',
}

const STATUS_CONFIG: Record<string, { bar: string; glow: string; badge: string }> = {
  ok: { bar: 'bg-brand-teal', glow: '', badge: '' },
  warning: { bar: 'bg-amber-400', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.3)]', badge: 'bg-amber-400/20 text-amber-300' },
  exceeded: { bar: 'bg-orange-500', glow: 'shadow-[0_0_8px_rgba(249,115,22,0.4)]', badge: 'bg-orange-500/20 text-orange-300' },
  whale: { bar: 'bg-red-500', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]', badge: 'bg-red-500/20 text-red-300' },
}

const POLL_INTERVAL = 60_000 // 60 seconds

export function SidebarUsageWidget() {
  const [quota, setQuota] = useState<QuotaData | null>(null)

  const fetchQuota = useCallback(() => {
    fetch('/api/user/quota')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: QuotaData | null) => setQuota(data))
      .catch(() => null)
  }, [])

  useEffect(() => {
    fetchQuota()
    const interval = setInterval(fetchQuota, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchQuota])

  if (!quota) return null

  const config = STATUS_CONFIG[quota.status] ?? STATUS_CONFIG.ok
  const pct = Math.min(100, quota.usedPct)
  const remaining = Math.max(0, quota.effectiveBudgetUsd - quota.usedUsd)

  return (
    <div className="px-4 pb-3">
      <div className={`rounded-xl bg-white/5 px-3 py-3 transition-shadow ${config.glow}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Uso de IA
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60">
            {PLAN_LABELS[quota.plan] ?? quota.plan}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${config.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Usage numbers */}
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-sm font-bold tabular-nums text-white/90">
            ${quota.usedUsd.toFixed(2)}
          </span>
          <span className="text-[10px] text-white/40">
            de ${quota.effectiveBudgetUsd.toFixed(2)}
          </span>
        </div>

        {/* Remaining budget */}
        {quota.status === 'ok' && (
          <p className="mt-0.5 text-[10px] text-white/30">
            ${remaining.toFixed(2)} disponible
          </p>
        )}

        {/* Credits indicator */}
        {quota.creditsUsd > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[10px]">💎</span>
            <p className="text-[10px] font-medium text-brand-teal/80">
              +${quota.creditsUsd.toFixed(0)} creditos extra
            </p>
          </div>
        )}

        {/* Status badges and actions */}
        {quota.status === 'exceeded' || quota.status === 'whale' ? (
          <Link
            href="/settings?upgrade=true"
            className={`mt-2 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${config.badge} hover:brightness-125`}
          >
            <span className="text-xs">{quota.status === 'whale' ? '🐋' : '⚡'}</span>
            Comprar creditos
          </Link>
        ) : quota.status === 'warning' ? (
          <div className={`mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1 ${config.badge}`}>
            <span className="text-[10px]">⚠️</span>
            <span className="text-[10px] font-medium">{quota.usedPct}% usado</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
