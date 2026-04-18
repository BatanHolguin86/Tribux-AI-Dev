'use client'

import { StatusBadge } from './StatusBadge'

type PhaseStatus = 'completed' | 'active' | 'locked'

type PhaseCardProps = {
  phaseNumber: number
  title: string
  description: string
  status: PhaseStatus
  progress: number
  hasGate?: boolean
  onClick?: () => void
}

const PHASE_COLORS: Record<number, string> = {
  0: '#6366F1',
  1: '#8B5CF6',
  2: '#0EA5A3',
  3: '#0EA5A3',
  4: '#10B981',
  5: '#F59E0B',
  6: '#F97316',
  7: '#EF4444',
}

export function PhaseCard({
  phaseNumber,
  title,
  description,
  status,
  progress,
  hasGate = false,
  onClick,
}: PhaseCardProps) {
  const phaseColor = PHASE_COLORS[phaseNumber] ?? '#6B7280'
  const isLocked = status === 'locked'
  const phaseNum = String(phaseNumber).padStart(2, '0')

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`w-full rounded-xl border bg-white p-5 text-left transition-all dark:bg-brand-primary ${
        isLocked
          ? 'cursor-not-allowed border-brand-border/50 opacity-50 dark:border-brand-border-dark/50'
          : 'border-brand-border hover:border-brand-teal/50 hover:shadow-md dark:border-brand-border-dark dark:hover:border-brand-teal/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: phaseColor }}
        >
          {phaseNum}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-bold text-brand-primary dark:text-white">{title}</h3>
            {hasGate && <StatusBadge variant="gate" />}
            {status === 'completed' && <StatusBadge variant="completed" label="Completada" />}
          </div>
          <p className="mt-0.5 text-xs text-brand-muted">{description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-[#F1F5F9] dark:bg-brand-navy">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${phaseColor}, ${phaseColor}CC)`,
            }}
          />
        </div>
        <p className="mt-1.5 text-right text-[10px] text-brand-muted">{progress}% completa</p>
      </div>
    </button>
  )
}
