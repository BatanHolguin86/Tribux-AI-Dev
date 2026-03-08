'use client'

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
  if (!open) return null

  const plans = PLANS.map((p) => ({
    ...p,
    current: p.name.toLowerCase() === currentPlan,
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Limite de proyectos alcanzado</h2>
        <p className="mt-1 text-sm text-gray-600">
          Tu plan actual no permite mas proyectos. Upgrade para continuar.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border-2 p-4 ${
                plan.current ? 'border-violet-600 bg-violet-50' : 'border-gray-200'
              }`}
            >
              <p className="font-semibold text-gray-900">{plan.name}</p>
              <p className="text-sm font-medium text-violet-600">{plan.price}</p>
              <p className="mt-1 text-xs text-gray-500">{plan.projects}</p>
              {plan.current && (
                <span className="mt-2 inline-block text-xs font-medium text-violet-600">
                  Plan actual
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
