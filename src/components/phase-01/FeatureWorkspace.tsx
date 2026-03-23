'use client'

import { useState, useCallback } from 'react'
import type { KiroDocumentType } from '@/types/feature'
import { KIRO_DOC_LABELS } from '@/lib/ai/prompts/phase-01'
import { DocumentPanel } from '@/components/shared/document/DocumentPanel'
import { DocumentTypeNav } from './DocumentTypeNav'
import { KiroWorkflowRail } from './KiroWorkflowRail'
import { KiroChat } from './KiroChat'

type FeatureWorkspaceProps = {
  projectId: string
  feature: {
    id: string
    name: string
    description: string | null
    status: string
    documents: Record<KiroDocumentType, {
      id: string
      content: string | null
      version: number
      status: string
    } | null>
    conversations: Record<KiroDocumentType, Array<{ role: string; content: string }>>
  }
  onBack: () => void
  onDocumentGenerated: () => void
  onDocumentApproved: () => void
}

export function FeatureWorkspace({
  projectId,
  feature,
  onBack,
  onDocumentGenerated,
  onDocumentApproved,
}: FeatureWorkspaceProps) {
  const [activeDocType, setActiveDocType] = useState<KiroDocumentType>(() => {
    // Start at the first doc type that isn't approved yet
    if (!feature.documents.requirements || feature.documents.requirements.status !== 'approved') return 'requirements'
    if (!feature.documents.design || feature.documents.design.status !== 'approved') return 'design'
    return 'tasks'
  })
  const [mobileTab, setMobileTab] = useState<'chat' | 'document'>('chat')

  const currentDoc = feature.documents[activeDocType] ?? null
  const currentConversation = feature.conversations[activeDocType] ?? []
  const shouldShowDocumentPanel =
    !!currentDoc &&
    (currentDoc.status === 'approved' || (!!currentDoc.content && currentDoc.content.trim().length > 0))

  const handleDocTypeSelect = useCallback((docType: KiroDocumentType) => {
    setActiveDocType(docType)
    setMobileTab('chat')
  }, [])

  // Progress for this feature
  const docsApproved = (['requirements', 'design', 'tasks'] as KiroDocumentType[]).filter(
    (dt) => feature.documents[dt]?.status === 'approved',
  ).length

  return (
    <div className="flex h-full flex-col">
      {/* Header with back button and feature info */}
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Features
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
            {feature.name}
          </h2>
          {feature.description && (
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{feature.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {(['requirements', 'design', 'tasks'] as KiroDocumentType[]).map((dt) => {
            const doc = feature.documents[dt]
            const isApproved = doc?.status === 'approved'
            const isDraft = doc?.status === 'draft'
            return (
              <span
                key={dt}
                className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                  isApproved
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : isDraft
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                {dt[0].toUpperCase()}
              </span>
            )
          })}
          <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">{docsApproved}/3</span>
        </div>
      </div>

      {/* Mobile tabs for chat/document */}
      <div className="mb-2 flex border-b border-gray-200 dark:border-gray-700 lg:hidden">
        {(['chat', 'document'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mobileTab === tab
                ? 'border-b-2 border-violet-600 text-violet-700 dark:text-violet-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'chat' ? 'Chat + Spec' : 'Documento'}
          </button>
        ))}
      </div>

      {/* Main workspace: chat + document panels */}
      <div className="flex min-h-0 flex-1 gap-3">
        {/* Left: Chat panel with doc type tabs + workflow + chat */}
        <div
          className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${
            shouldShowDocumentPanel ? 'lg:flex-[6]' : 'lg:flex-1'
          } ${mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex'}`}
        >
          <DocumentTypeNav
            documents={feature.documents}
            activeDocType={activeDocType}
            onSelect={handleDocTypeSelect}
          />
          <KiroWorkflowRail documents={feature.documents} activeDocType={activeDocType} />
          <KiroChat
            key={`${feature.id}-${activeDocType}`}
            projectId={projectId}
            featureId={feature.id}
            featureName={feature.name}
            docType={activeDocType}
            docStatus={currentDoc?.status ?? null}
            initialMessages={currentConversation}
            hasDocument={currentDoc !== null}
            onDocumentGenerated={onDocumentGenerated}
            onDocumentApproved={onDocumentApproved}
          />
        </div>

        {/* Right: Document panel */}
        {shouldShowDocumentPanel && (
          <div
            className={`lg:flex-[4] ${
              mobileTab !== 'document' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <DocumentPanel
              projectId={projectId}
              title={KIRO_DOC_LABELS[activeDocType]}
              document={currentDoc}
            />
          </div>
        )}
      </div>
    </div>
  )
}
