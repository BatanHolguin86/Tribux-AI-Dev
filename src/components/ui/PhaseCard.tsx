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
      className={`w-full rounded-xl border bg-white p-5 text-left transition-all dark:bg-[#0F2B46] ${
        isLocked
          ? 'cursor-not-allowed border-[#E2E8F0]/50 opacity-50 dark:border-[#1E3A55]/50'
          : 'border-[#E2E8F0] hover:border-[#0EA5A3]/50 hover:shadow-md dark:border-[#1E3A55] dark:hover:border-[#0EA5A3]/50'
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
            <h3 className="font-display text-sm font-bold text-[#0F2B46] dark:text-white">{title}</h3>
            {hasGate && <StatusBadge variant="gate" />}
            {status === 'completed' && <StatusBadge variant="completed" label="Completada" />}
          </div>
          <p className="mt-0.5 text-xs text-[#94A3B8]">{description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-[#F1F5F9] dark:bg-[#0A1F33]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${phaseColor}, ${phaseColor}CC)`,
            }}
          />
        </div>
        <p className="mt-1.5 text-right text-[10px] text-[#94A3B8]">{progress}% completa</p>
      </div>
    </button>
  )
}
