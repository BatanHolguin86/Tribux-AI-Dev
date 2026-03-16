'use client'

import { useState } from 'react'

type TrialBannerProps = {
  daysRemaining: number
  subscriptionStatus: string
}

export function TrialBanner({ daysRemaining, subscriptionStatus }: TrialBannerProps) {
  const [loading, setLoading] = useState(false)

  if (subscriptionStatus !== 'trialing' || daysRemaining <= 0) return null

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
      // Fallback: navigate to settings
      window.location.href = '/settings?tab=billing'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`rounded-lg px-4 py-2.5 text-center text-sm font-medium ${
        urgency
          ? 'bg-amber-50 text-amber-800 border border-amber-200'
          : 'bg-violet-50 text-violet-700 border border-violet-200'
      }`}
    >
      {daysRemaining === 1
        ? 'Tu prueba gratuita termina manana.'
        : `Te quedan ${daysRemaining} dias de prueba gratuita.`}{' '}
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className={`font-semibold underline ${urgency ? 'text-amber-900' : 'text-violet-800'}`}
      >
        {loading ? 'Redirigiendo...' : 'Upgrade ahora'}
      </button>
    </div>
  )
}
