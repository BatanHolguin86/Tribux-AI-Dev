'use client'

import { useState } from 'react'

type TrialBannerProps = {
  daysRemaining: number
  subscriptionStatus: string
}

export function TrialBanner({ daysRemaining, subscriptionStatus }: TrialBannerProps) {
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (subscriptionStatus !== 'trialing' || daysRemaining <= 0 || dismissed) return null

  const urgency = daysRemaining <= 2

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'builder' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      window.location.href = '/settings?tab=billing'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl px-4 py-2.5 ${
        urgency
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800'
          : 'bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800'
      }`}
    >
      {/* Icon + message */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm ${
            urgency
              ? 'bg-amber-100 dark:bg-amber-900/30'
              : 'bg-violet-100 dark:bg-violet-900/30'
          }`}
        >
          {urgency ? '⏳' : '✨'}
        </div>
        <p className={`text-sm font-medium ${
          urgency ? 'text-amber-800 dark:text-amber-300' : 'text-violet-700 dark:text-violet-300'
        }`}>
          {daysRemaining === 1
            ? 'Tu prueba gratuita termina manana.'
            : `Te quedan ${daysRemaining} dias de prueba gratuita.`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 ${
            urgency
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {loading ? 'Redirigiendo...' : 'Upgrade ahora'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className={`shrink-0 rounded-lg p-1.5 transition-colors ${
            urgency
              ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'
              : 'text-violet-400 hover:text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30'
          }`}
          aria-label="Cerrar banner"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
