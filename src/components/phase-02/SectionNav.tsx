'use client'

import type { Phase02Section, SectionStatus } from '@/types/conversation'
import { PHASE02_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-02'

type SectionNavProps = {
  sections: Array<{ key: Phase02Section; status: SectionStatus }>
  activeSection: Phase02Section
  onSelect: (section: Phase02Section) => void
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
  section: Phase02Section,
  sections: Array<{ key: Phase02Section; status: SectionStatus }>
): boolean {
  const idx = PHASE02_SECTIONS.indexOf(section)
  if (idx === 0) return true
  const prevSection = sections.find((s) => s.key === PHASE02_SECTIONS[idx - 1])
  return prevSection?.status === 'approved'
}

export function SectionNav({ sections, activeSection, onSelect }: SectionNavProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-3 py-2">
      {sections.map((section) => {
        const accessible = isSectionAccessible(section.key, sections)
        const isActive = section.key === activeSection
        const isLocked = !accessible && section.status === 'pending'

        return (
          <button
            key={section.key}
            onClick={() => accessible && onSelect(section.key)}
            disabled={isLocked}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-violet-100 text-violet-700'
                : isLocked
                  ? 'cursor-not-allowed text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={isLocked ? 'Aprueba la seccion anterior para desbloquear' : SECTION_LABELS[section.key]}
          >
            <StatusIcon status={section.status} />
            <span className="hidden sm:inline">{SECTION_LABELS[section.key]}</span>
            <span className="sm:hidden">{SECTION_LABELS[section.key].split(' ')[0]}</span>
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
