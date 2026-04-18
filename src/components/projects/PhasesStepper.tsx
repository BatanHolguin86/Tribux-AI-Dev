'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [resetTarget, setResetTarget] = useState<number | null>(null)
  const [resetting, setResetting] = useState(false)

  const currentPathPhase = pathname.match(/\/phase\/(\d+)/)
  const activePathPhase = currentPathPhase ? parseInt(currentPathPhase[1]) : null

  const completedCount = phases.filter((p) => p.status === 'completed').length
  const totalPhases = PHASES_META.length
  const progress = Math.round((completedCount / totalPhases) * 100)

  async function handleReset(phaseNumber: number) {
    setResetting(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/phases/${phaseNumber}/reset`,
        { method: 'POST' },
      )
      if (res.ok) {
        setResetTarget(null)
        router.refresh()
      }
    } catch {
      // Silenciar — el usuario puede reintentar
    } finally {
      setResetting(false)
    }
  }

  // Count how many subsequent phases would be affected
  function affectedPhasesCount(phaseNumber: number): number {
    return phases.filter(
      (p) => p.phase_number > phaseNumber && p.status !== 'locked',
    ).length
  }

  return (
    <>
      <nav className="rounded-xl bg-gradient-to-b from-[#0A1F33] to-[#0F2B46] p-4 shadow-[var(--shadow-sidebar)]">
        {/* Header with progress */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-white/50">
            Fases del proyecto
          </h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-brand-teal">
            {progress}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-1 rounded-full gradient-phase transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {activePathPhase !== null && (
          <p className="mb-3 rounded-lg bg-white/5 px-2.5 py-2 text-[11px] leading-snug text-white/70">
            <span className="font-semibold text-white">Ahora:</span>{' '}
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
            const canReset = status === 'completed' || status === 'active'

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
                canReset={canReset}
                onReset={() => setResetTarget(meta.number)}
              />
            )
          })}
        </div>

        {/* Knowledge base + Infrastructure links */}
        <div className="mt-3 space-y-0.5 border-t border-white/10 pt-3">
          <Link
            href={`/projects/${projectId}/knowledge`}
            className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all ${
              pathname?.includes('/knowledge')
                ? 'bg-brand-teal/15'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center text-sm">
              📚
            </div>
            <span
              className={`text-sm font-medium ${
                pathname?.includes('/knowledge') ? 'text-brand-teal' : 'text-white/70'
              }`}
            >
              Base de Conocimiento
            </span>
          </Link>

          <Link
            href={`/projects/${projectId}/infrastructure`}
            className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all ${
              pathname?.includes('/infrastructure')
                ? 'bg-brand-teal/15'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center text-sm">
              🔌
            </div>
            <span
              className={`text-sm font-medium ${
                pathname?.includes('/infrastructure') ? 'text-brand-teal' : 'text-white/70'
              }`}
            >
              Infraestructura
            </span>
          </Link>

          <Link
            href={`/projects/${projectId}/costs`}
            className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all ${
              pathname?.includes('/costs')
                ? 'bg-brand-teal/15'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center text-sm">
              💰
            </div>
            <span
              className={`text-sm font-medium ${
                pathname?.includes('/costs') ? 'text-brand-teal' : 'text-white/70'
              }`}
            >
              Control de Costos
            </span>
          </Link>
        </div>
      </nav>

      {/* Reset confirmation modal */}
      {resetTarget !== null && (
        <ResetModal
          phaseNumber={resetTarget}
          phaseName={PHASES_META.find((m) => m.number === resetTarget)?.name ?? ''}
          affectedCount={affectedPhasesCount(resetTarget)}
          resetting={resetting}
          onConfirm={() => handleReset(resetTarget)}
          onCancel={() => setResetTarget(null)}
        />
      )}
    </>
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
  canReset,
  onReset,
}: {
  href?: string
  icon: string
  phaseNum: string
  label: string
  status: PhaseStatus
  isActive: boolean
  isLast: boolean
  canReset: boolean
  onReset: () => void
}) {
  // Phase colors: 00=#6366F1, 01=#8B5CF6, 02=#0EA5A3, 03=#0EA5A3, 04=#10B981, 05=#F59E0B, 06=#F97316, 07=#EF4444
  const PHASE_COLORS: Record<string, string> = {
    '00': '#6366F1',
    '01': '#8B5CF6',
    '02': '#0EA5A3',
    '03': '#0EA5A3',
    '04': '#10B981',
    '05': '#F59E0B',
    '06': '#F97316',
    '07': '#EF4444',
  }

  const phaseColor = PHASE_COLORS[phaseNum] ?? '#6B7280'

  const content = (
    <div
      className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all ${
        isActive
          ? 'bg-brand-teal/20'
          : status === 'completed'
            ? 'hover:bg-white/5'
            : status === 'active'
              ? 'hover:bg-white/5'
              : ''
      }`}
    >
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={`absolute left-[1.55rem] top-[2.75rem] h-[calc(100%-1rem)] w-px ${
            status === 'completed' ? 'bg-green-500/50' : 'bg-white/10'
          }`}
        />
      )}

      {/* Phase number square */}
      <div className="relative z-10 flex shrink-0 items-center justify-center">
        {status === 'completed' ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : status === 'active' ? (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: phaseColor }}
          >
            <span className="font-mono text-sm font-bold text-white">{phaseNum}</span>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <span className="font-mono text-sm font-bold text-white/30">{phaseNum}</span>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <span className="text-sm leading-none">{icon}</span>
        <div className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm font-medium leading-tight ${
              isActive
                ? 'font-semibold text-brand-teal'
                : status === 'completed'
                  ? 'text-white/80'
                  : status === 'active'
                    ? 'text-white'
                    : 'text-white/30'
            }`}
          >
            {label}
          </span>
          <span
            className={`text-[10px] leading-tight ${
              isActive
                ? 'text-brand-teal'
                : status === 'completed'
                  ? 'text-green-400'
                  : 'text-white/40'
            }`}
          >
            Fase {phaseNum}
          </span>
        </div>
      </div>

      {/* Reset button (visible on hover for completed/active phases) */}
      {canReset && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onReset()
          }}
          className="shrink-0 rounded p-1 text-white/20 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
          title={`Reiniciar Phase ${phaseNum}`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}

      {/* Active indicator (teal dot) */}
      {isActive && !canReset && (
        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

function ResetModal({
  phaseNumber,
  phaseName,
  affectedCount,
  resetting,
  onConfirm,
  onCancel,
}: {
  phaseNumber: number
  phaseName: string
  affectedCount: number
  resetting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const phaseNum = String(phaseNumber).padStart(2, '0')
  const totalAffected = affectedCount + 1 // include the target phase

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Warning icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h3 className="mb-2 text-center text-base font-bold text-gray-900 dark:text-gray-100">
          Reiniciar Fase {phaseNum}
        </h3>

        <p className="mb-1 text-center text-sm text-gray-600 dark:text-gray-400">
          {phaseName}
        </p>

        <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-xs leading-relaxed text-red-800 dark:text-red-300">
            Esto eliminara <strong>todos los documentos, conversaciones y progreso</strong> de
            {totalAffected > 1
              ? ` Phase ${phaseNum} y las ${affectedCount} fases posteriores.`
              : ` Phase ${phaseNum}.`}
            {' '}Esta accion no se puede deshacer.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={resetting}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={resetting}
            className="flex-1 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {resetting ? 'Reseteando...' : 'Confirmar reset'}
          </button>
        </div>
      </div>
    </div>
  )
}
