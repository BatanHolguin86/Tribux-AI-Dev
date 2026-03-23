'use client'

import Link from 'next/link'
import type { PhaseStatus } from '@/types/project'

type PhaseData = {
  phase_number: number
  status: PhaseStatus
}

type Suggestion = {
  icon: string
  text: string
  href: string
  priority: 'high' | 'medium' | 'low'
}

type ProactiveSuggestionsProps = {
  projectId: string
  phases: PhaseData[]
  currentPhase: number
}

function generateSuggestions(
  projectId: string,
  phases: PhaseData[],
  currentPhase: number
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const phaseNum = (n: number) => String(n).padStart(2, '0')
  const activePhase = phases.find((p) => p.status === 'active')
  const completedCount = phases.filter((p) => p.status === 'completed').length

  // Primary: continue with active phase
  if (activePhase) {
    const phaseActions: Record<number, { icon: string; text: string }> = {
      0: { icon: '🔍', text: 'Continua el brief de Discovery con el agente' },
      1: { icon: '📋', text: 'Define los specs KIRO de tus features' },
      2: { icon: '🏗️', text: 'Revisa y aprueba la arquitectura del sistema' },
      3: { icon: '⚙️', text: 'Completa el checklist de environment setup' },
      4: { icon: '💻', text: 'Gestiona las tasks del Kanban de desarrollo' },
      5: { icon: '🧪', text: 'Completa el checklist de testing y QA' },
      6: { icon: '🚀', text: 'Verifica el checklist de lanzamiento' },
      7: { icon: '📈', text: 'Recopila feedback y planifica siguiente ciclo' },
    }

    const action = phaseActions[activePhase.phase_number] ?? {
      icon: '▶️',
      text: `Continua con Phase ${phaseNum(activePhase.phase_number)}`,
    }

    suggestions.push({
      icon: action.icon,
      text: action.text,
      href: `/projects/${projectId}/phase/${phaseNum(activePhase.phase_number)}`,
      priority: 'high',
    })
  }

  // Secondary: talk to CTO Virtual (in the Equipo tab of the active phase)
  if (activePhase) {
    suggestions.push({
      icon: '🤖',
      text: 'Consulta al CTO en el tab Equipo de tu fase activa',
      href: `/projects/${projectId}/phase/${phaseNum(activePhase.phase_number)}`,
      priority: 'medium',
    })
  }

  const phase04Completed = phases.find((p) => p.phase_number === 4)?.status === 'completed'
  const phase05Completed = phases.find((p) => p.phase_number === 5)?.status === 'completed'

  // Tertiary: solo sugerencias alineadas a gates (no saltar fases)
  if (phase04Completed && !phase05Completed) {
    suggestions.push({
      icon: '🧪',
      text: 'Phase 04 completada: cuando quieras, revisa Testing y QA (Phase 05)',
      href: `/projects/${projectId}/phase/05`,
      priority: 'low',
    })
  } else if (completedCount === 0) {
    suggestions.push({
      icon: '💡',
      text: 'Primer paso: definir el problema en Discovery (Phase 00)',
      href: `/projects/${projectId}/phase/00`,
      priority: 'low',
    })
  } else if (phase05Completed) {
    suggestions.push({
      icon: '🎯',
      text: 'QA listo: revisa el checklist de lanzamiento (Phase 06) cuando toque',
      href: `/projects/${projectId}/phase/06`,
      priority: 'low',
    })
  }

  return suggestions.slice(0, 3)
}

export function ProactiveSuggestions({ projectId, phases, currentPhase }: ProactiveSuggestionsProps) {
  const suggestions = generateSuggestions(projectId, phases, currentPhase)

  if (suggestions.length === 0) return null

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Sugerencias
      </h3>
      <div className="space-y-2">
        {suggestions.map((s, i) => {
          const isHigh = s.priority === 'high'

          return (
            <Link
              key={i}
              href={s.href}
              className={`group flex items-center gap-3 rounded-xl border p-3 transition-all ${
                isHigh
                  ? 'border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-white dark:from-violet-900/20 dark:to-gray-900 hover:shadow-md hover:shadow-violet-100/50 dark:hover:shadow-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${
                  isHigh
                    ? 'bg-violet-100 dark:bg-violet-900/30'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {s.icon}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`block text-xs font-semibold leading-snug ${
                    isHigh
                      ? 'text-violet-800 dark:text-violet-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {s.text}
                </span>
                {isHigh && (
                  <span className="mt-0.5 block text-[10px] text-violet-500 dark:text-violet-500">
                    Donde sigue tu proceso
                  </span>
                )}
              </div>
              <svg
                className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  isHigh ? 'text-violet-400 dark:text-violet-500' : 'text-gray-300 dark:text-gray-600'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
