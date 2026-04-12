'use client'

import { TribuxLogo } from '@/components/ui/TribuxLogo'

type WelcomeStepProps = {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-6">
        <TribuxLogo size={64} />
      </div>

      <h1 className="text-3xl font-bold text-gray-900">Te damos la bienvenida a Tribux</h1>
      <p className="mt-3 text-lg text-gray-600">
        Tu equipo de agentes IA esta listo para construir tu producto.
      </p>

      <div className="mt-8 space-y-4 text-left">
        {[
          {
            title: 'Tu lideras el proyecto',
            desc: 'Defines la vision, tomas decisiones y apruebas cada fase.',
          },
          {
            title: 'Equipo de 8 agentes',
            desc: 'CTO Virtual + 7 agentes especializados que disenan, construyen y lanzan contigo.',
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
