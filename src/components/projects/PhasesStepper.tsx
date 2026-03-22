'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PHASES_META } from '@/types/phase'
import type { PhaseStatus } from '@/types/project'

type PhaseData = {
  phase_number: number
  status: PhaseStatus
}

type PhasesStepperProps = {
  projectId: string
  phases: PhaseData[]
}

export function PhasesStepper({ projectId, phases }: PhasesStepperProps) {
  const pathname = usePathname()

  const currentPathPhase = pathname.match(/\/phase\/(\d+)/)
  const activePathPhase = currentPathPhase ? parseInt(currentPathPhase[1]) : null

  const completedCount = phases.filter((p) => p.status === 'completed').length
  const totalPhases = PHASES_META.length
  const progress = Math.round((completedCount / totalPhases) * 100)

  return (
    <nav className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      {/* Header with progress */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Fases del proyecto
        </h3>
        <span className="rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-400">
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-1 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {activePathPhase !== null && (
        <p className="mb-3 rounded-lg bg-gray-50 px-2.5 py-2 text-[11px] leading-snug text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Ahora:</span>{' '}
          {PHASES_META.find((m) => m.number === activePathPhase)?.description}. Avanza solo cuando apruebes cada
          bloque en la pantalla.
        </p>
      )}

      {/* Phases list with vertical line */}
      <div className="relative space-y-0.5">
        {PHASES_META.map((meta, index) => {
          const phaseData = phases.find((p) => p.phase_number === meta.number)
          const status = phaseData?.status ?? 'locked'
          const isCurrentPath = activePathPhase === meta.number
          const isClickable = status !== 'locked'
          const phaseNum = String(meta.number).padStart(2, '0')
          const isLast = index === PHASES_META.length - 1

          return (
            <StepperItem
              key={meta.number}
              href={isClickable ? `/projects/${projectId}/phase/${phaseNum}` : undefined}
              icon={meta.icon}
              phaseNum={phaseNum}
              label={meta.name}
              status={status}
              isActive={isCurrentPath}
              isLast={isLast}
            />
          )
        })}
      </div>
    </nav>
  )
}

function StepperItem({
  href,
  icon,
  phaseNum,
  label,
  status,
  isActive,
  isLast,
}: {
  href?: string
  icon: string
  phaseNum: string
  label: string
  status: PhaseStatus
  isActive: boolean
  isLast: boolean
}) {
  const content = (
    <div
      className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all ${
        isActive
          ? 'bg-violet-50 dark:bg-violet-900/20'
          : status === 'completed'
            ? 'hover:bg-green-50/50 dark:hover:bg-green-900/10'
            : status === 'active'
              ? 'hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
              : ''
      }`}
    >
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={`absolute left-[1.19rem] top-[2.25rem] h-[calc(100%-0.5rem)] w-px ${
            status === 'completed'
              ? 'bg-green-300 dark:bg-green-800'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        />
      )}

      {/* Status indicator */}
      <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
        {status === 'completed' ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : status === 'active' ? (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <div className="absolute h-5 w-5 animate-ping rounded-full bg-violet-400/30" />
            <div className="h-3 w-3 rounded-full bg-violet-500 ring-2 ring-violet-200 dark:ring-violet-800" />
          </div>
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
            <svg className="h-2.5 w-2.5 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <span className="text-sm leading-none">{icon}</span>
        <div className="min-w-0 flex-1">
          <span
            className={`block truncate text-xs font-medium leading-tight ${
              isActive
                ? 'text-violet-700 dark:text-violet-400'
                : status === 'completed'
                  ? 'text-gray-700 dark:text-gray-300'
                  : status === 'active'
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {label}
          </span>
          <span
            className={`text-[10px] leading-tight ${
              isActive
                ? 'text-violet-500 dark:text-violet-500'
                : status === 'completed'
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            Phase {phaseNum}
          </span>
        </div>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
