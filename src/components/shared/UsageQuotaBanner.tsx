'use client'

import { useEffect, useState } from 'react'
import { QuotaExceededModal } from './QuotaExceededModal'

type QuotaData = {
  usedUsd: number
  budgetUsd: number
  creditsUsd: number
  effectiveBudgetUsd: number
  usedPct: number
  status: 'ok' | 'warning' | 'exceeded' | 'whale'
  plan: string
  canTopUp: boolean
  message: string
}

export function UsageQuotaBanner() {
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [showModal, setShowModal] = useState(false)

  function fetchQuota() {
    fetch('/api/user/quota')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: QuotaData | null) => setQuota(data))
      .catch(() => null)
  }

  useEffect(() => { fetchQuota() }, [])

  if (!quota || quota.status === 'ok') return null

  const config = {
    warning: {
      wrap: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
      text: 'text-amber-800 dark:text-amber-200',
      bar: 'bg-amber-400',
      icon: '⚠️',
    },
    exceeded: {
      wrap: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30',
      text: 'text-orange-800 dark:text-orange-200',
      bar: 'bg-orange-500',
      icon: '🚫',
    },
    whale: {
      wrap: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
      text: 'text-red-800 dark:text-red-200',
      bar: 'bg-red-500',
      icon: '🐋',
    },
  }

  const c = config[quota.status]

  return (
    <>
      <div className={`rounded-lg border px-4 py-2.5 ${c.wrap}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden>{c.icon}</span>
            <p className={`text-sm font-medium ${c.text}`}>{quota.message}</p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* Mini progress bar */}
            <div className="hidden items-center gap-1.5 sm:flex">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${c.bar}`}
                  style={{ width: `${Math.min(100, quota.usedPct)}%` }}
                />
              </div>
              <span className={`text-xs font-bold tabular-nums ${c.text}`}>
                {quota.usedPct}%
              </span>
            </div>

            {quota.canTopUp && (quota.status === 'exceeded' || quota.status === 'whale') && (
              <button
                onClick={() => setShowModal(true)}
                className="rounded-lg bg-brand-primary px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-brand-navy"
              >
                Comprar creditos
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && quota.canTopUp && (
        <QuotaExceededModal
          usedPct={quota.usedPct}
          budgetUsd={quota.effectiveBudgetUsd}
          plan={quota.plan}
          onClose={() => setShowModal(false)}
          onTopUpComplete={() => {
            setShowModal(false)
            fetchQuota()
          }}
        />
      )}
    </>
  )
}
