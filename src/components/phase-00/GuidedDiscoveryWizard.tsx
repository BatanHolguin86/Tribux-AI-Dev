'use client'

import { useState } from 'react'
import { TribuxLogo } from '@/components/ui/TribuxLogo'

type GuidedDiscoveryWizardProps = {
  onComplete: (answers: { problem: string; audience: string; solution: string }) => void
  isSubmitting: boolean
}

const STEPS = [
  {
    title: 'Que problema resuelves?',
    subtitle: 'Describe el problema que tu producto va a solucionar. No necesitas ser tecnico — cuentalo como se lo dirias a alguien en un cafe.',
    placeholder: 'Ej: Los duenos de restaurantes pierden clientes porque no tienen un sistema facil para recibir pedidos online...',
    field: 'problem' as const,
  },
  {
    title: 'Para quien lo resuelves?',
    subtitle: 'Describe a las personas que tienen este problema. Quien son, que hacen, que les frustra.',
    placeholder: 'Ej: Duenos de restaurantes pequenos y medianos en LATAM, entre 30-50 anos, que atienden 50-200 clientes por dia...',
    field: 'audience' as const,
  },
  {
    title: 'Como imaginas la solucion?',
    subtitle: 'Describe que haria tu producto. No necesitas saber como se construye — solo que haria para resolver el problema.',
    placeholder: 'Ej: Una app donde el restaurante sube su menu, los clientes hacen pedidos desde su celular, y el dueno ve todo en un dashboard...',
    field: 'solution' as const,
  },
]

export function GuidedDiscoveryWizard({ onComplete, isSubmitting }: GuidedDiscoveryWizardProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ problem: '', audience: '', solution: '' })

  const currentStep = STEPS[step]
  const isLastStep = step === STEPS.length - 1
  const canProceed = answers[currentStep.field].trim().length >= 20

  function handleNext() {
    if (isLastStep) {
      onComplete(answers)
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4">
            <TribuxLogo size={48} />
          </div>
          <h1 className="font-display text-2xl font-bold text-brand-primary dark:text-white">
            Cuentanos tu idea
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            3 preguntas simples. Tu equipo IA se encarga del resto.
          </p>
        </div>

        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-brand-teal'
                  : i < step
                    ? 'w-2 bg-brand-teal/50'
                    : 'w-2 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-brand-navy">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand-teal">
            Paso {step + 1} de 3
          </div>
          <h2 className="font-display text-lg font-bold text-brand-primary dark:text-white">
            {currentStep.title}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {currentStep.subtitle}
          </p>

          <textarea
            value={answers[currentStep.field]}
            onChange={(e) => setAnswers({ ...answers, [currentStep.field]: e.target.value })}
            placeholder={currentStep.placeholder}
            rows={5}
            className="mt-4 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-[#0EA5A3] dark:border-gray-700 dark:bg-brand-primary dark:text-gray-100 dark:placeholder-gray-500"
            autoFocus
          />

          <div className="mt-4 flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Atras
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-navy disabled:opacity-50"
            >
              {isSubmitting
                ? 'Tu equipo IA esta analizando...'
                : isLastStep
                  ? 'Mi equipo IA se encarga'
                  : 'Siguiente'}
            </button>
          </div>
        </div>

        {/* Reassurance */}
        <p className="mt-4 text-center text-[11px] text-gray-400 dark:text-gray-500">
          No necesitas saber nada tecnico. Tu CTO Virtual analizara tus respuestas y creara el brief de tu proyecto.
        </p>
      </div>
    </div>
  )
}
