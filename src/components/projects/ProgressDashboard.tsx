'use client'

import type { PhaseStatus } from '@/types/project'

type PhaseData = {
  phase_number: number
  status: PhaseStatus
}

type ProgressDashboardProps = {
  phases: PhaseData[]
  projectName: string
  taskStats?: { total: number; done: number } | null
}

// Non-technical labels for each phase
const PHASE_LABELS: Record<number, { done: string; active: string; pending: string }> = {
  0: { done: 'Idea definida', active: 'Definiendo tu idea...', pending: 'Definir idea' },
  1: { done: 'Features especificados', active: 'Especificando features...', pending: 'Especificar features' },
  2: { done: 'Arquitectura disenada', active: 'Disenando arquitectura...', pending: 'Disenar arquitectura' },
  3: { done: 'Infraestructura lista', active: 'Configurando infraestructura...', pending: 'Configurar infraestructura' },
  4: { done: 'Codigo construido', active: 'Construyendo tu app...', pending: 'Construir app' },
  5: { done: 'Calidad verificada', active: 'Verificando calidad...', pending: 'Verificar calidad' },
  6: { done: 'App publicada', active: 'Publicando tu app...', pending: 'Publicar app' },
  7: { done: 'Ciclo completado', active: 'Iterando con feedback...', pending: 'Iterar y crecer' },
}

function getPhaseLabel(phase: number, status: PhaseStatus): string {
  const labels = PHASE_LABELS[phase]
  if (!labels) return ''
  if (status === 'completed') return labels.done
  if (status === 'active') return labels.active
  return labels.pending
}

function getPhaseIcon(status: PhaseStatus): string {
  if (status === 'completed') return '✅'
  if (status === 'active') return '🔨'
  return '⏳'
}

function getProgressMessage(progress: number): string {
  if (progress === 0) return 'Empecemos a construir tu app'
  if (progress < 25) return 'Tu app esta tomando forma'
  if (progress < 50) return 'Buen avance, sigue asi'
  if (progress < 75) return 'Tu app esta casi lista'
  if (progress < 100) return 'Ultimos pasos antes de publicar'
  return 'Tu app esta lista!'
}

function getProgressColor(progress: number): string {
  if (progress < 25) return 'from-red-400 to-orange-400'
  if (progress < 50) return 'from-orange-400 to-yellow-400'
  if (progress < 75) return 'from-yellow-400 to-green-400'
  return 'from-green-400 to-emerald-500'
}

export function ProgressDashboard({ phases, projectName, taskStats }: ProgressDashboardProps) {
  const completedCount = phases.filter((p) => p.status === 'completed').length
  const totalPhases = 8
  const progress = Math.round((completedCount / totalPhases) * 100)
  const activePhase = phases.find((p) => p.status === 'active')

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-violet-50/30 p-5 dark:border-gray-700 dark:from-gray-900 dark:to-violet-950/10">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {progress === 100 ? '🎉' : '🚀'} Tu app esta {progress}% lista
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getProgressMessage(progress)}
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800">
          <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{progress}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(progress)} transition-all duration-700`}
          style={{ width: `${Math.max(progress, 3)}%` }}
        />
      </div>

      {/* Task stats (if in dev phase) */}
      {taskStats && taskStats.total > 0 && (
        <div className="mb-4 rounded-lg bg-violet-50 px-4 py-2.5 dark:bg-violet-900/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
              Tasks de desarrollo
            </span>
            <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
              {taskStats.done}/{taskStats.total}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-200 dark:bg-violet-800">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${(taskStats.done / taskStats.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Phase steps */}
      <div className="space-y-1.5">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((phaseNum) => {
          const phase = phases.find((p) => p.phase_number === phaseNum)
          const status = phase?.status ?? 'locked'
          const icon = getPhaseIcon(status)
          const label = getPhaseLabel(phaseNum, status)
          const isActive = status === 'active'

          return (
            <div
              key={phaseNum}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-violet-100/60 dark:bg-violet-900/20'
                  : status === 'completed'
                    ? 'opacity-70'
                    : 'opacity-40'
              }`}
            >
              <span className="text-base">{icon}</span>
              <span className={`font-medium ${
                isActive
                  ? 'text-violet-700 dark:text-violet-300'
                  : status === 'completed'
                    ? 'text-gray-600 line-through dark:text-gray-400'
                    : 'text-gray-400 dark:text-gray-500'
              }`}>
                {label}
              </span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
