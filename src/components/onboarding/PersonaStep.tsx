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
    label: 'Emprendedora / Emprendedor',
    description: 'Quiero validar ideas de negocio sin depender de un equipo tecnico.',
    icon: '💡',
  },
]

const PERSONA_GUIDANCE: Record<Persona, { title: string; bullets: string[] }> = {
  founder: {
    title: 'Tu experiencia como Founder:',
    bullets: [
      'Describiras tu idea en 3 preguntas simples',
      'Tu equipo IA genera los documentos tecnicos',
      'Tu apruebas cada fase antes de avanzar',
      'No necesitas saber programar',
    ],
  },
  pm: {
    title: 'Tu experiencia como PM:',
    bullets: [
      'Veras specs detallados (KIRO format)',
      'Podras priorizar features y acceptance criteria',
      'Tu equipo IA ejecuta el desarrollo',
      'Dashboard de progreso por fase',
    ],
  },
  consultor: {
    title: 'Tu experiencia como Consultor:',
    bullets: [
      'Acceso completo a codigo y arquitectura',
      'Gestion de multiples clientes y proyectos',
      'Control total sobre cada decision tecnica',
      'P&L por proyecto para facturar a clientes',
    ],
  },
  emprendedor: {
    title: 'Tu experiencia como Emprendedora:',
    bullets: [
      'Describiras tu idea en 3 preguntas simples',
      'Tu equipo IA genera los documentos tecnicos',
      'Tu apruebas cada fase antes de avanzar',
      'No necesitas saber programar',
    ],
  },
}

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

      {selected && (
        <div className="mt-4 rounded-xl border border-brand-teal/20 bg-brand-surface/50 p-4 dark:bg-brand-navy/20">
          <p className="text-xs font-bold text-brand-primary dark:text-brand-teal">
            {PERSONA_GUIDANCE[selected].title}
          </p>
          <ul className="mt-2 space-y-1.5">
            {PERSONA_GUIDANCE[selected].bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <svg className="h-3.5 w-3.5 shrink-0 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

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
