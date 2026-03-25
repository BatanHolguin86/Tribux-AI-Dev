'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Phase00Section, SectionStatus } from '@/types/conversation'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { SectionNav } from './SectionNav'
import { ChatPanel } from './ChatPanel'
import { DocumentPanel } from './DocumentPanel'
import { Phase00FinalGate } from './Phase00FinalGate'

type SectionData = {
  key: Phase00Section
  label: string
  status: SectionStatus
  messages: Array<{ role: string; content: string; created_at: string }>
  document: {
    id: string
    content: string | null
    version: number
    status: string
  } | null
}

type Phase00LayoutProps = {
  projectId: string
  sections: SectionData[]
  initialActiveSection: Phase00Section
}

const phaseAgents = getPhaseAgents(0)

export function Phase00Layout({
  projectId,
  sections: initialSections,
  initialActiveSection,
}: Phase00LayoutProps) {
  const router = useRouter()
  const [sections, setSections] = useState(initialSections)
  const [activeSection, setActiveSection] = useState<Phase00Section>(initialActiveSection)
  const [mobileTab, setMobileTab] = useState<'chat' | 'document'>('chat')

  const currentSection = sections.find((s) => s.key === activeSection)!
  const allApproved = sections.every((s) => s.status === 'approved')

  const handleSectionApproved = useCallback(() => {
    setSections((prev) =>
      prev.map((s) =>
        s.key === activeSection ? { ...s, status: 'approved' as SectionStatus } : s
      )
    )
  }, [activeSection])

  const handleDocumentGenerated = useCallback(() => {
    router.refresh()
  }, [router])

  const approvedCount = sections.filter((s) => s.status === 'approved').length

  const sectionsContent = (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <div className="flex flex-1 items-center gap-1">
          {sections.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center gap-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  s.status === 'approved'
                    ? 'bg-emerald-500'
                    : s.key === activeSection
                      ? 'bg-violet-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
              {i < sections.length - 1 && <div className="h-px w-1.5 bg-gray-200 dark:bg-gray-700" />}
            </div>
          ))}
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
          {approvedCount}/{sections.length}
        </span>
      </div>

      {allApproved ? (
        <Phase00FinalGate projectId={projectId} />
      ) : (
        <>
          {/* Mobile tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 lg:hidden">
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mobileTab === 'chat'
                  ? 'border-b-2 border-violet-600 text-violet-700 dark:text-violet-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Conversacion
            </button>
            <button
              onClick={() => setMobileTab('document')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mobileTab === 'document'
                  ? 'border-b-2 border-violet-600 text-violet-700 dark:text-violet-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Documento
            </button>
          </div>

          {/* Desktop: split view */}
          <div className="flex h-[var(--content-height)] gap-4">
            <div className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/20 lg:flex-1 ${
              mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex'
            }`}>
              <SectionNav
                sections={sections.map((s) => ({ key: s.key, status: s.status }))}
                activeSection={activeSection}
                onSelect={setActiveSection}
              />
              <ChatPanel
                key={activeSection}
                projectId={projectId}
                section={activeSection}
                sectionStatus={currentSection.status}
                initialMessages={currentSection.messages}
                hasDocument={currentSection.document !== null}
                onSectionApproved={handleSectionApproved}
                onDocumentGenerated={handleDocumentGenerated}
              />
            </div>

            <div className={`min-w-0 overflow-hidden lg:flex-1 ${
              mobileTab !== 'document' ? 'hidden lg:flex' : 'flex'
            }`}>
              <DocumentPanel
                projectId={projectId}
                section={activeSection}
                document={currentSection.document}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <PhaseWorkspaceTabs
      phaseNumber={0}
      projectId={projectId}
      phaseAgents={phaseAgents}
      teamContent={(goToSecciones) => (
        <PhaseTeamPanel
          projectId={projectId}
          phaseNumber={0}
          agentTypes={phaseAgents}
          onGoToSecciones={goToSecciones}
        />
      )}
    >
      {sectionsContent}
    </PhaseWorkspaceTabs>
  )
}
