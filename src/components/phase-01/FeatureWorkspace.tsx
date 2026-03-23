'use client'

import { useState, useCallback } from 'react'
import type { KiroDocumentType } from '@/types/feature'
import { KIRO_DOC_LABELS, KIRO_DOC_TYPES } from '@/lib/ai/prompts/phase-01'
import { DocumentPanel } from '@/components/shared/document/DocumentPanel'
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
}

function isDocAccessible(
  docType: KiroDocumentType,
  documents: Record<KiroDocumentType, { status: string } | null>,
): boolean {
  const idx = KIRO_DOC_TYPES.indexOf(docType)
  if (idx === 0) return true
  const prevType = KIRO_DOC_TYPES[idx - 1]
  return documents[prevType]?.status === 'approved'
}

export function FeatureWorkspace({
  projectId,
  feature,
  onBack,
  onDocumentGenerated,
}: FeatureWorkspaceProps) {
  // Local document state so we can update after approval without a full page reload
  const [documents, setDocuments] = useState(feature.documents)

  const [activeDocType, setActiveDocType] = useState<KiroDocumentType>(() => {
    if (!feature.documents.requirements || feature.documents.requirements.status !== 'approved') return 'requirements'
    if (!feature.documents.design || feature.documents.design.status !== 'approved') return 'design'
    return 'tasks'
  })
  const [mobileTab, setMobileTab] = useState<'chat' | 'document'>('chat')

  const currentDoc = documents[activeDocType] ?? null
  const currentConversation = feature.conversations[activeDocType] ?? []
  const shouldShowDocumentPanel =
    !!currentDoc &&
    (currentDoc.status === 'approved' || (!!currentDoc.content && currentDoc.content.trim().length > 0))

  const handleDocTypeSelect = useCallback((docType: KiroDocumentType) => {
    setActiveDocType(docType)
    setMobileTab('chat')
  }, [])

  // Handle approval: update local state + switch to next doc type
  const handleDocApproved = useCallback((nextDocument: KiroDocumentType | null) => {
    setDocuments((prev) => ({
      ...prev,
      [activeDocType]: prev[activeDocType]
        ? { ...prev[activeDocType]!, status: 'approved' }
        : prev[activeDocType],
    }))
    if (nextDocument) {
      setActiveDocType(nextDocument)
      setMobileTab('chat')
    }
  }, [activeDocType])

  const docsApproved = (['requirements', 'design', 'tasks'] as KiroDocumentType[]).filter(
    (dt) => documents[dt]?.status === 'approved',
  ).length

  return (
    <div className="flex h-full flex-col gap-3">
      {/* ── Top bar: back + feature name + stepper ── */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Features</span>
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {feature.name}
          </h2>
        </div>

        {/* Progress badge */}
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          docsApproved === 3
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {docsApproved}/3
        </span>
      </div>

      {/* ── Document type stepper ── */}
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-700 dark:bg-gray-900">
        {KIRO_DOC_TYPES.map((dt, i) => {
          const doc = documents[dt]
          const isApproved = doc?.status === 'approved'
          const isActive = dt === activeDocType
          const isLocked = !isDocAccessible(dt, documents)

          return (
            <button
              key={dt}
              onClick={() => !isLocked && handleDocTypeSelect(dt)}
              disabled={isLocked}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-violet-100 text-violet-800 shadow-sm dark:bg-violet-900/40 dark:text-violet-200'
                  : isApproved
                    ? 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                    : isLocked
                      ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                      : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {/* Step number or check */}
              {isApproved ? (
                <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : isLocked ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  {i + 1}
                </span>
              )}
              {KIRO_DOC_LABELS[dt]}
            </button>
          )
        })}
      </div>

      {/* ── Mobile tabs ── */}
      {shouldShowDocumentPanel && (
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900 lg:hidden">
          {(['chat', 'document'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                mobileTab === tab
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'chat' ? 'Chat' : 'Documento'}
            </button>
          ))}
        </div>
      )}

      {/* ── Main content: chat + document ── */}
      <div className="flex min-h-0 flex-1 gap-3">
        {/* Chat panel */}
        <div
          className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${
            shouldShowDocumentPanel ? 'lg:flex-[6]' : 'lg:flex-1'
          } ${mobileTab !== 'chat' && shouldShowDocumentPanel ? 'hidden lg:flex' : 'flex'}`}
        >
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
            onDocumentApproved={handleDocApproved}
          />
        </div>

        {/* Document panel */}
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
