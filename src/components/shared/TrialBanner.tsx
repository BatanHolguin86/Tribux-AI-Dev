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
      className={`flex items-center justify-between gap-3 rounded-lg border-l-4 px-3 py-2 ${
        urgency
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
          : 'border-brand-teal bg-brand-surface dark:bg-brand-primary/20'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{urgency ? '⏳' : '✨'}</span>
        <p className={`text-sm font-medium ${
          urgency ? 'text-amber-800 dark:text-amber-300' : 'text-brand-primary dark:text-brand-teal'
        }`}>
          {daysRemaining === 1
            ? 'Tu prueba gratuita termina manana.'
            : `Te quedan ${daysRemaining} dias de prueba gratuita.`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Redirigiendo...' : 'Upgrade'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
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
