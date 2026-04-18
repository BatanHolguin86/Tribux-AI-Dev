'use client'

import { PHASE_NAMES } from '@/types/project'

const PHASE_ICONS = ['🔍', '📋', '🏗️', '⚙️', '💻', '🧪', '🚀', '📈']

const AGENTS = [
  { icon: '🧠', name: 'CTO Virtual', role: 'Lidera y orquesta todo el proyecto' },
  { icon: '📐', name: 'Product Architect', role: 'Producto, alcance y prioridades' },
  { icon: '🏛️', name: 'System Architect', role: 'Arquitectura y decisiones tecnicas' },
  { icon: '🎨', name: 'UI/UX Designer', role: 'Diseno visual y experiencia' },
  { icon: '💻', name: 'Lead Developer', role: 'Codigo, implementacion y debugging' },
  { icon: '🗄️', name: 'DB Admin', role: 'Base de datos, schemas y queries' },
  { icon: '🧪', name: 'QA Engineer', role: 'Testing y aseguramiento de calidad' },
  { icon: '🚀', name: 'DevOps & Operations', role: 'Deploy, CI/CD y monitoreo' },
]

type PhasesOverviewStepProps = {
  isSubmitting: boolean
  onFinish: () => void
  onBack: () => void
}

export function PhasesOverviewStep({ isSubmitting, onFinish, onBack }: PhasesOverviewStepProps) {
  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-2xl font-display font-bold text-gray-900">El camino de tu producto</h2>
      <p className="mt-2 text-sm text-gray-600">
        Tu equipo de agentes IA te guiara por estas 8 fases.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Justo despues de este paso empezaras en la <span className="font-medium">Phase 00 (Discovery)</span>,
        donde conversaras con el orquestador para definir el problema, tus usuarios y la propuesta de valor
        antes de pasar a los specs y al desarrollo.
      </p>

      {/* Tu equipo */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Tu equipo</p>
        <div className="grid grid-cols-2 gap-2">
          {AGENTS.map((agent) => (
            <div key={agent.name} className="flex items-center gap-2.5">
              <span className="text-base">{agent.icon}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-900">{agent.name}</p>
                <p className="truncate text-[10px] text-gray-400">{agent.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fases */}
      <div className="relative mt-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">8 fases de desarrollo</p>

        {/* Vertical line */}
        <div className="absolute left-5 top-10 h-[calc(100%-40px)] w-0.5 bg-gray-200" />

        <div className="space-y-3">
          {Object.entries(PHASE_NAMES).map(([num, name]) => {
            const phaseNum = Number(num)
            return (
              <div key={phaseNum} className="relative flex items-center gap-4">
                <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-2 ring-gray-200">
                  {PHASE_ICONS[phaseNum]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Phase {String(phaseNum).padStart(2, '0')}
                  </p>
                  <p className="text-sm text-gray-600">{name}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Atras
        </button>
        <button
          onClick={onFinish}
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-navy disabled:opacity-50"
        >
          {isSubmitting ? 'Creando proyecto...' : 'Comenzar mi proyecto'}
        </button>
      </div>
    </div>
  )
}
