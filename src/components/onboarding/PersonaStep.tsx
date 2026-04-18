'use client'

import type { Persona } from '@/types/user'

type PersonaOption = {
  value: Persona
  label: string
  description: string
  icon: string
}

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    value: 'founder',
    label: 'Founder / CEO',
    description: 'Tengo una idea de producto y quiero construirla rapido.',
    icon: '🚀',
  },
  {
    value: 'pm',
    label: 'Product Manager',
    description: 'Gestiono productos digitales y necesito acelerar el desarrollo.',
    icon: '📋',
  },
  {
    value: 'consultor',
    label: 'Consultor / Freelancer',
    description: 'Construyo soluciones para mis clientes de forma eficiente.',
    icon: '💼',
  },
  {
    value: 'emprendedor',
    label: 'Emprendedor',
    description: 'Quiero validar ideas de negocio sin depender de un equipo tecnico.',
    icon: '💡',
  },
]

type PersonaStepProps = {
  selected: Persona | null
  onSelect: (persona: Persona) => void
  onNext: () => void
  onBack: () => void
}

export function PersonaStep({ selected, onSelect, onNext, onBack }: PersonaStepProps) {
  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-2xl font-display font-bold text-gray-900">Cual es tu rol?</h2>
      <p className="mt-2 text-sm text-gray-600">
        Esto nos ayuda a personalizar tu experiencia.
      </p>

      <div className="mt-6 grid gap-3">
        {PERSONA_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
              selected === option.value
                ? 'border-brand-teal bg-brand-surface'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">{option.icon}</span>
            <div>
              <p className="font-medium text-gray-900">{option.label}</p>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Atras
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-navy disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
