'use client'

import { useState, useCallback } from 'react'
import type { Phase00Section, SectionStatus } from '@/types/conversation'
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

export function Phase00Layout({
  projectId,
  sections: initialSections,
  initialActiveSection,
}: Phase00LayoutProps) {
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
    // Trigger a reload to get the generated document
    window.location.reload()
  }, [])

  // Completed count for progress
  const approvedCount = sections.filter((s) => s.status === 'approved').length

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {sections.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1">
                <div
                  className={`h-1.5 w-8 rounded-full transition-all ${
                    s.status === 'approved'
                      ? 'bg-violet-600'
                      : s.key === activeSection
                        ? 'bg-violet-300'
                        : 'bg-gray-200'
                  }`}
                />
                {i < sections.length - 1 && <div className="h-px w-1 bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-xs font-medium text-gray-500">
          {approvedCount}/5
        </span>
      </div>

      {allApproved ? (
        <Phase00FinalGate projectId={projectId} />
      ) : (
        <>
          {/* Mobile tabs */}
          <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 lg:hidden">
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mobileTab === 'chat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Conversacion
            </button>
            <button
              onClick={() => setMobileTab('document')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mobileTab === 'document' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Documento
            </button>
          </div>

          {/* Desktop: split view */}
          <div className="flex h-[calc(100vh-12rem)] gap-3">
            {/* Left: Chat */}
            <div className={`flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:flex-[3] ${
              mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex'
            }`}>
              <SectionNav
                sections={sections.map((s) => ({ key: s.key, status: s.status }))}
                activeSection={activeSection}
                onSelect={setActiveSection}
              />
              <ChatPanel
                projectId={projectId}
                section={activeSection}
                sectionStatus={currentSection.status}
                initialMessages={currentSection.messages}
                hasDocument={currentSection.document !== null}
                onSectionApproved={handleSectionApproved}
                onDocumentGenerated={handleDocumentGenerated}
              />
            </div>

            {/* Right: Document */}
            <div className={`lg:flex-[2] ${
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
}
