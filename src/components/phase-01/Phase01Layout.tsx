'use client'

import { useState, useCallback } from 'react'
import type { KiroDocumentType } from '@/types/feature'
import { KIRO_DOC_LABELS } from '@/lib/ai/prompts/phase-01'
import { DocumentPanel } from '@/components/shared/document/DocumentPanel'
import { FeatureList } from './FeatureList'
import { FeatureSuggestions } from './FeatureSuggestions'
import { DiscoverySummary } from './DiscoverySummary'
import { DocumentTypeNav } from './DocumentTypeNav'
import { KiroChat } from './KiroChat'
import { Phase01FinalGate } from './Phase01FinalGate'

type FeatureData = {
  id: string
  name: string
  description: string | null
  display_order: number
  status: string
  documents: Record<KiroDocumentType, {
    id: string
    content: string | null
    version: number
    status: string
  } | null>
  conversations: Record<KiroDocumentType, Array<{ role: string; content: string }>>
}

type Phase01LayoutProps = {
  projectId: string
  features: FeatureData[]
  discoverySummary: Array<{ section: string; content: string }>
}

export function Phase01Layout({
  projectId,
  features: initialFeatures,
  discoverySummary,
}: Phase01LayoutProps) {
  const [features, setFeatures] = useState(initialFeatures)
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(
    initialFeatures[0]?.id ?? null,
  )
  const [activeDocType, setActiveDocType] = useState<KiroDocumentType>('requirements')
  const [mobileTab, setMobileTab] = useState<'list' | 'chat' | 'document'>('list')

  const activeFeature = features.find((f) => f.id === activeFeatureId)
  const currentDoc = activeFeature?.documents[activeDocType] ?? null
  const currentConversation = activeFeature?.conversations[activeDocType] ?? []
  const shouldShowDocumentPanel =
    !!currentDoc &&
    (currentDoc.status === 'approved' || (!!currentDoc.content && currentDoc.content.trim().length > 0))

  const allSpecComplete = features.length > 0 && features.every(
    (f) => f.status === 'spec_complete' || f.status === 'approved',
  )

  const completedFeatures = features.filter(
    (f) => f.status === 'spec_complete' || f.status === 'approved',
  ).length

  const handleFeatureSelect = useCallback((featureId: string) => {
    setActiveFeatureId(featureId)
    setActiveDocType('requirements')
    setMobileTab('chat')
  }, [])

  const handleDocTypeSelect = useCallback((docType: KiroDocumentType) => {
    setActiveDocType(docType)
  }, [])

  const handleFeaturesRefresh = useCallback(() => {
    window.location.reload()
  }, [])

  const handleDocumentGenerated = useCallback(() => {
    window.location.reload()
  }, [])

  const handleDocumentApproved = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {completedFeatures} de {features.length} features completados
        </p>
        {features.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-1.5 rounded-full bg-violet-600 transition-all"
                style={{ width: `${(completedFeatures / features.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {Math.round((completedFeatures / features.length) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Helper text: compactado para reducir ruido visual */}
      <details className="mb-4 text-xs text-gray-500 dark:text-gray-400" open={false}>
        <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-300">
          ¿Como avanzar en Phase 01?
        </summary>
        <p className="mt-2 max-w-3xl leading-relaxed">
          En Phase 01 dividimos tu producto en <span className="font-medium">features</span> (login,
          pagos, panel de admin, etc.). Para cada feature, el orquestador te guía para definir{' '}
          <span className="font-medium">Requirements → Design → Tasks</span> en ese orden.
        </p>
      </details>

      {/* Discovery summary */}
      <DiscoverySummary docs={discoverySummary} />

      {allSpecComplete ? (
        <Phase01FinalGate
          projectId={projectId}
          features={features.map((f) => ({ name: f.name, status: f.status }))}
        />
      ) : (
        <>
          {/* Mobile tabs */}
          <div className="mb-3 flex border-b border-gray-200 dark:border-gray-700 lg:hidden">
            {(['list', 'chat', 'document'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mobileTab === tab
                    ? 'border-b-2 border-violet-600 text-violet-700 dark:text-violet-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'list' ? 'Features' : tab === 'chat' ? 'Chat' : 'Documento'}
              </button>
            ))}
          </div>

          <div className="flex h-[var(--content-height)] gap-3">
            {/* Left sidebar: Feature list */}
            <div
              className={`w-72 flex-shrink-0 space-y-3 overflow-y-auto ${
                mobileTab !== 'list' ? 'hidden lg:block' : 'block'
              }`}
            >
              <FeatureList
                projectId={projectId}
                features={features.map((f) => ({
                  id: f.id,
                  name: f.name,
                  status: f.status,
                  documents: f.documents,
                }))}
                activeFeatureId={activeFeatureId}
                onSelect={handleFeatureSelect}
                onFeatureAdded={handleFeaturesRefresh}
              />

              <FeatureSuggestions
                projectId={projectId}
                onAccepted={handleFeaturesRefresh}
              />
            </div>

            {activeFeature ? (
              <>
                {/* Center: Chat */}
                <div
                  className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${
                    shouldShowDocumentPanel ? 'lg:flex-[7]' : 'lg:flex-1'
                  } ${
                    mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex'
                  }`}
                >
                  <DocumentTypeNav
                    documents={activeFeature.documents}
                    activeDocType={activeDocType}
                    onSelect={handleDocTypeSelect}
                  />
                  <p className="border-b border-gray-100 bg-gray-50/80 px-3 py-1.5 text-[11px] leading-snug text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">KIRO:</span> orden{' '}
                    <span className="font-medium">Requirements → Design → Tasks</span>. La pestaña{' '}
                    <span className="font-medium">Tasks</span> se desbloquea solo cuando{' '}
                    <span className="font-medium">Design</span> está <span className="font-medium">aprobado</span>{' '}
                    (generar documento y confirmar). En Design se alinea el contorno técnico; el desglose TASK-001… va en Tasks.
                  </p>
                  <KiroChat
                    key={`${activeFeatureId}-${activeDocType}`}
                    projectId={projectId}
                    featureId={activeFeature.id}
                    featureName={activeFeature.name}
                    docType={activeDocType}
                    docStatus={currentDoc?.status ?? null}
                    initialMessages={currentConversation}
                    hasDocument={currentDoc !== null}
                    onDocumentGenerated={handleDocumentGenerated}
                    onDocumentApproved={handleDocumentApproved}
                  />
                </div>

                {/* Right: Document panel */}
                {shouldShowDocumentPanel && (
                  <div
                    className={`lg:flex-[3] ${
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
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {features.length === 0
                      ? 'Agrega o pide sugerencias de features para comenzar.'
                      : 'Selecciona un feature para comenzar su spec KIRO.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
