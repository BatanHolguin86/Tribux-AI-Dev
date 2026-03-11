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

  return (
    <nav className="rounded-lg border border-gray-200 bg-white p-3">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Fases del proyecto
      </h3>
      <div className="space-y-1">
        {PHASES_META.map((meta) => {
          const phaseData = phases.find((p) => p.phase_number === meta.number)
          const status = phaseData?.status ?? 'locked'
          const isCurrentPath = activePathPhase === meta.number
          const isClickable = status !== 'locked'
          const phaseNum = String(meta.number).padStart(2, '0')

          return (
            <StepperItem
              key={meta.number}
              href={isClickable ? `/projects/${projectId}/phase/${phaseNum}` : undefined}
              icon={meta.icon}
              label={`${phaseNum} ${meta.name}`}
              status={status}
              isActive={isCurrentPath}
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
  label,
  status,
  isActive,
}: {
  href?: string
  icon: string
  label: string
  status: PhaseStatus
  isActive: boolean
}) {
  const statusStyles = {
    completed: 'text-green-700 bg-green-50',
    active: 'text-violet-700 bg-violet-50',
    locked: 'text-gray-400 bg-gray-50',
  }

  const dotStyles = {
    completed: 'bg-green-500',
    active: 'bg-violet-500 animate-pulse',
    locked: 'bg-gray-300',
  }

  const content = (
    <div
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
        statusStyles[status]
      } ${isActive ? 'ring-2 ring-violet-400 ring-offset-1' : ''} ${
        href ? 'cursor-pointer hover:brightness-95' : 'cursor-default'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className={`flex-1 truncate text-xs font-medium ${status === 'locked' ? 'text-gray-400' : ''}`}>
        {label}
      </span>
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotStyles[status]}`} />
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
