'use client'

import { useState } from 'react'
import { CREDIT_PACKS } from '@/lib/plans/credit-packs'
import type { CreditPack } from '@/lib/plans/credit-packs'

type QuotaExceededModalProps = {
  usedPct: number
  budgetUsd: number
  plan: string
  onClose: () => void
  onTopUpComplete?: () => void
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  builder: 'Builder',
  agency: 'Agency',
  enterprise: 'Enterprise',
}

export function QuotaExceededModal({
  usedPct,
  budgetUsd,
  plan,
  onClose,
  onTopUpComplete,
}: QuotaExceededModalProps) {
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handlePurchase() {
    if (!selectedPack) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/billing/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: selectedPack.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Error al procesar el pago.')
        return
      }

      // Stripe checkout → redirect
      if (data.url) {
        window.location.href = data.url
        return
      }

      // Dev mode → instant credit
      if (data.success) {
        setSuccess(true)
        onTopUpComplete?.()
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="text-center">
            <div className="text-4xl">✅</div>
            <h2 className="mt-3 font-display text-lg font-bold text-[#0F2B46] dark:text-white">
              Creditos agregados
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Se agregaron ${selectedPack?.amountUsd} de creditos de IA.
              Ya puedes seguir construyendo.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-[#0F2B46] py-2.5 text-sm font-medium text-white hover:bg-[#0A1F33]"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/10">
            <span className="text-xl">⚡</span>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold text-[#0F2B46] dark:text-white">
              Necesitas mas creditos de IA
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Usaste el {usedPct}% de tu presupuesto mensual ({PLAN_LABELS[plan] ?? plan}: ${budgetUsd.toFixed(2)}/mes).
              Compra creditos adicionales para seguir sin interrupciones.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Credit packs */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {CREDIT_PACKS.map((pack) => {
            const isSelected = selectedPack?.id === pack.id
            return (
              <button
                key={pack.id}
                onClick={() => setSelectedPack(pack)}
                className={`rounded-xl border-2 p-4 text-center transition-all ${
                  isSelected
                    ? 'border-[#0EA5A3] bg-[#E8F4F8] dark:bg-[#0F2B46]/30'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }`}
              >
                <p className="font-display text-xl font-bold text-[#0F2B46] dark:text-white">
                  ${pack.priceUsd}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#0EA5A3]">
                  {pack.label}
                </p>
                <p className="mt-1 text-[10px] text-gray-400">
                  ~{Math.round(pack.amountUsd / 1.7)} builds extra
                </p>
              </button>
            )
          })}
        </div>

        {/* Info */}
        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Los creditos se aplican al mes actual. No se acumulan.
            Para mas capacidad permanente, considera mejorar tu plan.
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <a
            href="/settings?upgrade=true"
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Mejorar plan
          </a>
          <button
            onClick={handlePurchase}
            disabled={!selectedPack || loading}
            className="flex-1 rounded-lg bg-[#0F2B46] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0A1F33] disabled:opacity-50"
          >
            {loading ? 'Procesando...' : selectedPack ? `Comprar $${selectedPack.priceUsd}` : 'Selecciona un pack'}
          </button>
        </div>
      </div>
    </div>
  )
}
