'use client'

import { useState } from 'react'
import { PaywallModal } from './PaywallModal'

type PlanGuardProps = {
  hasAccess: boolean
  currentPlan: string
  feature?: string
  children: React.ReactNode
}

export function PlanGuard({ hasAccess, currentPlan, feature, children }: PlanGuardProps) {
  const [showPaywall, setShowPaywall] = useState(!hasAccess)

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="text-4xl">🔒</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {feature ? `${feature} requiere un plan superior` : 'Funcionalidad premium'}
        </h2>
        <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
          Tu plan actual no incluye acceso a esta funcionalidad. Upgrade para desbloquear todas las
          capacidades de AI Squad.
        </p>
        <button
          onClick={() => setShowPaywall(true)}
          className="rounded-lg bg-[#0F2B46] px-6 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-900/20 transition-colors hover:bg-[#0A1F33]"
        >
          Ver planes
        </button>
      </div>
      <PaywallModal
        open={showPaywall}
        currentPlan={currentPlan}
        feature={feature}
        onClose={() => setShowPaywall(false)}
      />
    </>
  )
}
