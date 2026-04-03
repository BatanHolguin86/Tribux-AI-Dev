'use client'

type WelcomeStepProps = {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F4F8]">
        <svg className="h-8 w-8 text-[#0F2B46]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900">Bienvenido a AI Squad</h1>
      <p className="mt-3 text-lg text-gray-600">
        Tu equipo de agentes IA esta listo para construir tu producto.
      </p>

      <div className="mt-8 space-y-4 text-left">
        {[
          {
            title: 'Tu eres el CEO',
            desc: 'Defines la vision, tomas decisiones y apruebas cada fase.',
          },
          {
            title: 'Equipo de 9 agentes',
            desc: 'CTO Virtual + 8 agentes especializados que diseñan, construyen y lanzan contigo.',
          },
          {
            title: '8 fases de desarrollo',
            desc: 'Desde la idea hasta el lanzamiento, paso a paso.',
          },
        ].map((item) => (
          <div key={item.title} className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0F2B46] text-xs text-white">
              ✓
            </div>
            <div>
              <p className="font-medium text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="mt-8 w-full rounded-lg bg-[#0F2B46] px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33]"
      >
        Comenzar
      </button>
    </div>
  )
}
