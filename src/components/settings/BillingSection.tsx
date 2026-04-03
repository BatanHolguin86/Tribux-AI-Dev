'use client'

import { useState, useEffect } from 'react'

const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[] }> = {
  starter: {
    name: 'Starter',
    price: '$149/mes',
    features: ['1 proyecto', 'CTO Virtual', 'Phase 00-01'],
  },
  builder: {
    name: 'Builder',
    price: '$299/mes',
    features: ['3 proyectos', '8 agentes', 'Phases 02-07', 'Diseño & UX (hub)'],
  },
  agency: {
    name: 'Agency',
    price: '$699/mes',
    features: ['10 proyectos', 'Agente Operator', 'Soporte prioritario'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Contactar',
    features: ['Proyectos ilimitados', 'SLA dedicado', 'Soporte 24/7'],
  },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing: { label: 'Periodo de prueba', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
  active: { label: 'Activo', color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
  free: { label: 'Gratuito', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  canceled: { label: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
  past_due: { label: 'Pago pendiente', color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
}

type BillingSectionProps = {
  currentPlan: string
  subscriptionStatus: string
  trialDaysRemaining: number
  isTrialActive: boolean
  isPaid: boolean
  billingStatus?: string
  billingPlan?: string
  stripeCustomerId?: string | null
}

export function BillingSection({
  currentPlan,
  subscriptionStatus,
  trialDaysRemaining,
  isTrialActive,
  isPaid,
  billingStatus,
  billingPlan,
  stripeCustomerId,
}: BillingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAlert, setShowAlert] = useState(!!billingStatus)

  useEffect(() => {
    if (billingStatus) {
      const timer = setTimeout(() => setShowAlert(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [billingStatus])

  const planOrder = ['starter', 'builder', 'agency', 'enterprise']
  const currentIndex = planOrder.indexOf(currentPlan)
  const statusInfo = STATUS_LABELS[subscriptionStatus] ?? STATUS_LABELS.free
  const planDetail = PLAN_DETAILS[currentPlan]

  async function handleUpgrade(plan: string) {
    setLoading(plan)
    setError(null)

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Error al procesar')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section id="billing" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Plan y facturacion</h2>

      {showAlert && billingStatus === 'success' && (
        <div className="mt-3 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Tu plan ha sido actualizado a <strong>{billingPlan}</strong> exitosamente.
        </div>
      )}

      {showAlert && billingStatus === 'canceled' && (
        <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          El proceso de pago fue cancelado. Puedes intentar de nuevo cuando quieras.
        </div>
      )}

      <div className="mt-4 flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{planDetail?.name ?? currentPlan}</p>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          {planDetail && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{planDetail.price}</p>
          )}
          {isTrialActive && (
            <p className="mt-1 text-sm text-blue-600">
              {trialDaysRemaining === 1
                ? 'Tu prueba termina manana'
                : `${trialDaysRemaining} dias restantes de prueba`}
            </p>
          )}
          {planDetail && (
            <ul className="mt-3 space-y-1">
              {planDetail.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-green-500">&#10003;</span> {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {!isPaid && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Planes disponibles</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {planOrder
              .filter((p) => p !== 'enterprise')
              .map((plan) => {
                const detail = PLAN_DETAILS[plan]
                const isUpgrade = planOrder.indexOf(plan) > currentIndex
                const isCurrent = plan === currentPlan

                return (
                  <div
                    key={plan}
                    className={`rounded-lg border-2 p-4 ${
                      isCurrent
                        ? 'border-[#0EA5A3] bg-[#E8F4F8] dark:bg-[#0F2B46]/20'
                        : isUpgrade
                          ? 'border-gray-200 dark:border-gray-700'
                          : 'border-gray-200 dark:border-gray-700 opacity-50'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{detail.name}</p>
                    <p className="text-sm font-medium text-[#0F2B46] dark:text-[#0EA5A3]">{detail.price}</p>
                    <ul className="mt-2 space-y-1">
                      {detail.features.map((f) => (
                        <li key={f} className="text-xs text-gray-500 dark:text-gray-400">{f}</li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <span className="mt-3 inline-block text-xs font-medium text-[#0F2B46] dark:text-[#0EA5A3]">
                        Plan actual
                      </span>
                    ) : isUpgrade ? (
                      <button
                        onClick={() => handleUpgrade(plan)}
                        disabled={loading === plan}
                        className="mt-3 w-full rounded-md bg-[#0F2B46] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0A1F33] disabled:opacity-50"
                      >
                        {loading === plan ? 'Procesando...' : 'Upgrade'}
                      </button>
                    ) : null}
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {isPaid && stripeCustomerId && (
        <div className="mt-4">
          <button
            onClick={async () => {
              setPortalLoading(true)
              setError(null)
              try {
                const res = await fetch('/api/billing/portal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                })
                const data = await res.json()
                if (!res.ok) {
                  setError(data.message ?? data.error ?? 'Error al abrir el portal')
                  return
                }
                if (data.url) window.location.href = data.url
              } catch {
                setError('Error de conexion. Intenta de nuevo.')
              } finally {
                setPortalLoading(false)
              }
            }}
            disabled={portalLoading}
            className="rounded-md bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {portalLoading ? 'Abriendo...' : 'Gestionar suscripcion'}
          </button>
        </div>
      )}
      {isPaid && !stripeCustomerId && (
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Para cambiar o cancelar tu suscripcion, contacta a soporte.
        </p>
      )}
    </section>
  )
}
