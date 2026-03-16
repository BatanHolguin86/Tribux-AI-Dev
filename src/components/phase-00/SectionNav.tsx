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
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50/50 px-2 py-1.5 scrollbar-hide">
      {sections.map((section, i) => {
        const accessible = isSectionAccessible(section.key, sections)
        const isActive = section.key === activeSection
        const isLocked = !accessible && section.status === 'pending'

        return (
          <button
            key={section.key}
            onClick={() => accessible && onSelect(section.key)}
            disabled={isLocked}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              isActive
                ? 'bg-white text-violet-700 shadow-sm ring-1 ring-violet-200'
                : isLocked
                  ? 'cursor-not-allowed text-gray-300'
                  : 'text-gray-500 hover:bg-white/60 hover:text-gray-700'
            }`}
            title={isLocked ? 'Aprueba la seccion anterior para desbloquear' : SECTION_LABELS[section.key]}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {section.status === 'approved' ? (
                <StatusIcon status={section.status} />
              ) : (
                <span className={`text-[10px] ${isActive ? 'text-violet-500' : 'text-gray-400'}`}>{i + 1}</span>
              )}
            </span>
            <span className="hidden md:inline">{SHORT_LABELS[section.key] ?? SECTION_LABELS[section.key]}</span>
            <span className="md:hidden">{SHORT_LABELS[section.key] ?? SECTION_LABELS[section.key].split(' ')[0]}</span>
            {isLocked && (
              <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
