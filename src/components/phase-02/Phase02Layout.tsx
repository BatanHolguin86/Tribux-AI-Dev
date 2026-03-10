'use client'

import { useState, useCallback } from 'react'
import type { Phase02Section, SectionStatus } from '@/types/conversation'
import { SectionNav } from './SectionNav'
import { ChatPanel } from './ChatPanel'
import { DocumentPanel } from './DocumentPanel'
import { Phase02FinalGate } from './Phase02FinalGate'

type SectionData = {
  key: Phase02Section
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

type Phase02LayoutProps = {
  projectId: string
  sections: SectionData[]
  initialActiveSection: Phase02Section
}

export function Phase02Layout({
  projectId,
  sections: initialSections,
  initialActiveSection,
}: Phase02LayoutProps) {
  const [sections, setSections] = useState(initialSections)
  const [activeSection, setActiveSection] = useState<Phase02Section>(initialActiveSection)
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
    window.location.reload()
  }, [])

  const approvedCount = sections.filter((s) => s.status === 'approved').length
  const totalSections = sections.length

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {approvedCount} de {totalSections} secciones completadas
        </p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-violet-600 transition-all"
              style={{ width: `${(approvedCount / totalSections) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500">
            {Math.round((approvedCount / totalSections) * 100)}%
          </span>
        </div>
      </div>

      {allApproved ? (
        <Phase02FinalGate projectId={projectId} />
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
          <div className="flex h-[calc(100vh-14rem)] gap-4">
            {/* Left: Chat */}
            <div className={`flex flex-col rounded-lg border border-gray-200 bg-white lg:flex-[6] ${
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
            <div className={`lg:flex-[4] ${
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
