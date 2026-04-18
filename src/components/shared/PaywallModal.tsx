'use client'

import { useState, useEffect } from 'react'
import { useFocusTrap } from '@/hooks/use-focus-trap'

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$49/mes',
    features: ['1 proyecto', 'CTO + Product Architect + UI/UX', 'Phases 00-02', '7 dias de prueba gratis'],
    purchasable: true,
  },
  {
    key: 'builder',
    name: 'Builder',
    price: '$149/mes',
    features: ['Todo en Starter', '1 proyecto', '8 agentes especializados', 'Phases 00-06, auto-build 10 tasks'],
    purchasable: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$299/mes',
    features: ['Todo en Builder', '3 proyectos', '8 agentes, todas las fases', 'Auto-build ilimitado'],
    purchasable: true,
  },
  {
    key: 'agency',
    name: 'Agency',
    price: '$699/mes',
    features: ['Todo en Pro', '10 proyectos', '8 agentes, multi-client', 'Soporte prioritario'],
    purchasable: true,
  },
]

type PaywallModalProps = {
  open: boolean
  currentPlan: string
  feature?: string
  onClose: () => void
}

export function PaywallModal({ open, currentPlan, feature, onClose }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trapRef = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (!open) return
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  const planOrder = ['starter', 'builder', 'pro', 'agency']
  const currentIndex = planOrder.indexOf(currentPlan)

  async function handleUpgrade() {
    const plan = selectedPlan
    if (!plan) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Error al procesar el pago')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div ref={trapRef} role="dialog" aria-modal="true" className="relative z-10 w-full max-w-2xl rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl dark:shadow-black/30">
        <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100">
          {feature
            ? `Upgrade para acceder a ${feature}`
            : 'Upgrade tu plan'}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Tu plan actual no incluye esta funcionalidad. Elige un plan para continuar.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan
            const isUpgrade = plan.purchasable && planOrder.indexOf(plan.key) > currentIndex
            const isSelected = selectedPlan === plan.key
            return (
              <button
                key={plan.key}
                type="button"
                disabled={!isUpgrade}
                onClick={() => isUpgrade && setSelectedPlan(plan.key)}
                className={`rounded-lg border-2 p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-[#0EA5A3] bg-[#E8F4F8] dark:bg-[#0F2B46]/20 ring-2 ring-[#0EA5A3]'
                    : isCurrent
                      ? 'border-[#0EA5A3] bg-[#E8F4F8] dark:bg-[#0F2B46]/20'
                      : isUpgrade
                        ? 'border-gray-200 dark:border-gray-700 hover:border-[#0EA5A3] cursor-pointer'
                        : 'border-gray-200 dark:border-gray-700 opacity-50'
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</p>
                <p className="text-sm font-medium text-[#0F2B46] dark:text-[#0EA5A3]">{plan.price}</p>
                <ul className="mt-2 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-gray-500 dark:text-gray-400">
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent && (
                  <span className="mt-2 inline-block text-xs font-medium text-[#0F2B46] dark:text-[#0EA5A3]">
                    Plan actual
                  </span>
                )}
                {isSelected && (
                  <span className="mt-2 inline-block text-xs font-medium text-[#0F2B46] dark:text-[#0EA5A3]">
                    Seleccionado
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cerrar
          </button>
          <button
            onClick={handleUpgrade}
            disabled={!selectedPlan || loading}
            className="flex-1 rounded-lg bg-[#0F2B46] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Upgrade'}
          </button>
        </div>
      </div>
    </div>
  )
}
