'use client'

import type { Phase00Section, SectionStatus } from '@/types/conversation'
import { PHASE00_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-00'

type SectionNavProps = {
  sections: Array<{ key: Phase00Section; status: SectionStatus }>
  activeSection: Phase00Section
  onSelect: (section: Phase00Section) => void
}

function StatusIcon({ status }: { status: SectionStatus }) {
  switch (status) {
    case 'approved':
      return (
        <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )
    case 'completed':
    case 'in_progress':
      return (
        <svg className="h-3.5 w-3.5 animate-pulse text-violet-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )
    default:
      return <span className="block h-2 w-2 rounded-full bg-gray-300" />
  }
}

function isSectionAccessible(
  section: Phase00Section,
  sections: Array<{ key: Phase00Section; status: SectionStatus }>
): boolean {
  const idx = PHASE00_SECTIONS.indexOf(section)
  if (idx === 0) return true
  const prevSection = sections.find((s) => s.key === PHASE00_SECTIONS[idx - 1])
  return prevSection?.status === 'approved'
}

const SHORT_LABELS: Record<string, string> = {
  problem_statement: 'Problema',
  personas: 'Personas',
  value_proposition: 'Propuesta',
  metrics: 'Metricas',
  competitive_analysis: 'Competencia',
}

export function SectionNav({ sections, activeSection, onSelect }: SectionNavProps) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b border-gray-200 bg-gray-50 px-3 py-2 scrollbar-hide">
      {sections.map((section, i) => {
        const accessible = isSectionAccessible(section.key, sections)
        const isActive = section.key === activeSection
        const isLocked = !accessible && section.status === 'pending'
        const isApproved = section.status === 'approved'

        return (
          <button
            key={section.key}
            onClick={() => accessible && onSelect(section.key)}
            disabled={isLocked}
            className={`group relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              isActive
                ? 'bg-white text-violet-700 shadow-sm ring-1 ring-gray-200'
                : isApproved
                  ? 'text-green-700 hover:bg-white/70'
                  : isLocked
                    ? 'cursor-not-allowed text-gray-300'
                    : 'text-gray-500 hover:bg-white/70 hover:text-gray-700'
            }`}
            title={isLocked ? 'Aprueba la seccion anterior para desbloquear' : SECTION_LABELS[section.key]}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              isApproved
                ? 'bg-green-100 text-green-700'
                : isActive
                  ? 'bg-violet-100 text-violet-600'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {isApproved ? (
                <StatusIcon status={section.status} />
              ) : isLocked ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </span>
            <span>{SHORT_LABELS[section.key] ?? SECTION_LABELS[section.key]}</span>
          </button>
        )
      })}
    </div>
  )
}
