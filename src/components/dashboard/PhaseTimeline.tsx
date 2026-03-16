import type { ProjectPhase } from '@/types/project'
import { PHASES_META } from '@/types/phase'

type PhaseTimelineProps = {
  phases: ProjectPhase[]
  variant: 'mini' | 'full'
}

function PhaseIcon({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <svg className="h-3.5 w-3.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (status === 'active') {
    return (
      <svg className="h-3.5 w-3.5 animate-pulse text-violet-600 dark:text-violet-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    )
  }
  return (
    <svg className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  )
}

export function PhaseTimeline({ phases, variant }: PhaseTimelineProps) {
  if (variant === 'mini') {
    return (
      <div className="flex items-center gap-1">
        {phases.map((phase) => (
          <div
            key={phase.phase_number}
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              phase.status === 'completed'
                ? 'bg-green-100 dark:bg-green-900/30'
                : phase.status === 'active'
                  ? 'bg-violet-100 dark:bg-violet-900/30'
                  : 'bg-gray-100 dark:bg-gray-800'
            }`}
            title={PHASES_META[phase.phase_number]?.name}
          >
            <PhaseIcon status={phase.status} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {phases.map((phase) => {
        const meta = PHASES_META[phase.phase_number]
        return (
          <div key={phase.phase_number} className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                phase.status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : phase.status === 'active'
                    ? 'bg-violet-100 dark:bg-violet-900/30'
                    : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <PhaseIcon status={phase.status} />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Phase {String(phase.phase_number).padStart(2, '0')}
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{meta?.name}</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                phase.status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : phase.status === 'active'
                    ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              }`}
            >
              {phase.status === 'completed'
                ? 'Completada'
                : phase.status === 'active'
                  ? 'Activa'
                  : 'Bloqueada'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
