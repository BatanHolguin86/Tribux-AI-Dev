'use client'

import { useEffect } from 'react'
import { useFocusTrap } from '@/hooks/use-focus-trap'

const PLANS = [
  { name: 'Starter', price: '$149/mes', projects: '1 proyecto', current: true },
  { name: 'Builder', price: '$299/mes', projects: '3 proyectos', current: false },
  { name: 'Agency', price: '$699/mes', projects: '10 proyectos', current: false },
  { name: 'Enterprise', price: 'Contactar', projects: 'Ilimitados', current: false },
]

type PlanLimitModalProps = {
  open: boolean
  currentPlan: string
  onClose: () => void
}

export function PlanLimitModal({ open, currentPlan, onClose }: PlanLimitModalProps) {
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (!open) return
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  const plans = PLANS.map((p) => ({
    ...p,
    current: p.name.toLowerCase() === currentPlan,
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div ref={trapRef} role="dialog" aria-modal="true" className="relative z-10 w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl dark:shadow-black/30">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Limite de proyectos alcanzado</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Tu plan actual no permite mas proyectos. Upgrade para continuar.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border-2 p-4 ${
                plan.current ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</p>
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400">{plan.price}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{plan.projects}</p>
              {plan.current && (
                <span className="mt-2 inline-block text-xs font-medium text-violet-600 dark:text-violet-400">
                  Plan actual
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              // TODO: integrate with Stripe checkout
              onClose()
            }}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
          >
            Upgrade
          </button>
        </div>
      </div>
    </div>
  )
}
