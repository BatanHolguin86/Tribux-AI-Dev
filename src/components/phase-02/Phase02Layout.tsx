'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Phase02Section, SectionStatus } from '@/types/conversation'
import type { DesignWorkflowContext } from '@/lib/ai/context-builder'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { DesignGenerator } from '@/components/design/DesignGenerator'
import { SectionNav } from './SectionNav'
import { ChatPanel } from './ChatPanel'
import { DocumentPanel } from './DocumentPanel'
import { Phase02FinalGate } from './Phase02FinalGate'
import { DesignHubSectionCallout } from './DesignHubSectionCallout'

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

type Artifact = {
  id: string
  title: string
  document_type: string
  status: string
  created_at: string
}

type Phase02LayoutProps = {
  projectId: string
  sections: SectionData[]
  initialActiveSection: Phase02Section
  approvedDesigns: Array<{
    id: string
    screen_name: string
    type: string
    status: string
    created_at: string
  }>
  designArtifacts?: Artifact[]
  workflowContext?: DesignWorkflowContext
  connectedTools?: { figma: boolean; v0: boolean }
}

const phaseAgents = getPhaseAgents(2)

export function Phase02Layout({
  projectId,
  sections: initialSections,
  initialActiveSection,
  approvedDesigns,
  designArtifacts = [],
  workflowContext,
  connectedTools,
}: Phase02LayoutProps) {
  const router = useRouter()
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
    router.refresh()
  }, [router])

  const approvedCount = sections.filter((s) => s.status === 'approved').length
  const totalSections = sections.length

  // Secciones tab content
  const sectionsContent = (
    <div>
      {/* Progress header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {approvedCount} de {totalSections} secciones
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-1.5 rounded-full bg-violet-600 transition-all"
                style={{ width: `${(approvedCount / totalSections) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {Math.round((approvedCount / totalSections) * 100)}%
            </span>
          </div>
        </div>

        {/* Approved designs count badge */}
        {approvedDesigns.length > 0 && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {approvedDesigns.length} diseno{approvedDesigns.length !== 1 ? 's' : ''} aprobado{approvedDesigns.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <DesignHubSectionCallout
        projectId={projectId}
        artifactCount={designArtifacts.length}
        approvedCount={approvedDesigns.length}
      />

      {allApproved ? (
        <Phase02FinalGate projectId={projectId} />
      ) : (
        <>
          {/* Mobile sub-tabs for chat/document */}
          <div className="mb-3 flex border-b border-gray-200 dark:border-gray-700 lg:hidden">
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
            <div className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 lg:flex-1 ${
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

  // Herramientas tab content — unified Design Hub
  const toolsContent = workflowContext ? (
    <DesignGenerator
      projectId={projectId}
      existingArtifacts={designArtifacts}
      workflowContext={workflowContext}
      connectedTools={connectedTools}
    />
  ) : (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-12 text-center dark:border-gray-600 dark:bg-gray-900/40">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Completa Phase 00 (Discovery) para desbloquear las herramientas de diseno.
      </p>
    </div>
  )

  return (
    <PhaseWorkspaceTabs
      phaseNumber={2}
      projectId={projectId}
      hasTools={true}
      phaseAgents={phaseAgents}
      teamContent={(goToSecciones) => (
        <PhaseTeamPanel
          projectId={projectId}
          phaseNumber={2}
          agentTypes={phaseAgents}
          onGoToSecciones={goToSecciones}
        />
      )}
      toolsContent={toolsContent}
    >
      {sectionsContent}
    </PhaseWorkspaceTabs>
  )
}
