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

  // Secondary: talk to CTO Virtual
  suggestions.push({
    icon: '🤖',
    text: 'Consulta al CTO Virtual sobre tu proyecto',
    href: `/projects/${projectId}/agents`,
    priority: 'medium',
  })

  // Tertiary: progress-based suggestions
  if (completedCount >= 4 && currentPhase < 5) {
    suggestions.push({
      icon: '🧪',
      text: 'Tu proyecto esta listo para empezar testing',
      href: `/projects/${projectId}/phase/05`,
      priority: 'low',
    })
  } else if (completedCount === 0) {
    suggestions.push({
      icon: '💡',
      text: 'Empieza definiendo el problema que resuelves',
      href: `/projects/${projectId}/phase/00`,
      priority: 'low',
    })
  } else if (completedCount >= 6) {
    suggestions.push({
      icon: '🎯',
      text: 'Estas cerca del lanzamiento — revisa el checklist',
      href: `/projects/${projectId}/phase/06`,
      priority: 'low',
    })
  }

  return suggestions.slice(0, 3)
}

const priorityStyles = {
  high: 'border-violet-200 bg-violet-50 hover:bg-violet-100',
  medium: 'border-gray-200 bg-white hover:bg-gray-50',
  low: 'border-gray-100 bg-gray-50 hover:bg-gray-100',
}

export function ProactiveSuggestions({ projectId, phases, currentPhase }: ProactiveSuggestionsProps) {
  const suggestions = generateSuggestions(projectId, phases, currentPhase)

  if (suggestions.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Acciones sugeridas
      </h3>
      {suggestions.map((s, i) => (
        <Link
          key={i}
          href={s.href}
          className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${priorityStyles[s.priority]}`}
        >
          <span className="text-lg">{s.icon}</span>
          <span className="flex-1 text-sm font-medium text-gray-700">{s.text}</span>
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ))}
    </div>
  )
}
