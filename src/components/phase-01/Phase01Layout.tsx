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
        <p className="text-sm text-gray-600">
          {completedFeatures} de {features.length} features completados
        </p>
        {features.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-violet-600 transition-all"
                style={{ width: `${(completedFeatures / features.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500">
              {Math.round((completedFeatures / features.length) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Helper text: qué hacer en Phase 01 */}
      <p className="mb-4 text-xs text-gray-500">
        En Phase 01 dividimos tu producto en <span className="font-medium">features</span>{' '}
        (partes como <span className="italic">login, pagos, panel de admin</span>). Para cada
        feature, el orquestador te guiara para definir{' '}
        <span className="font-medium">Requirements → Design → Tasks</span> en ese orden.
      </p>

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
          <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 lg:hidden">
            {(['list', 'chat', 'document'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mobileTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {tab === 'list' ? 'Features' : tab === 'chat' ? 'Chat' : 'Documento'}
              </button>
            ))}
          </div>

          <div className="flex h-[calc(100vh-16rem)] gap-4">
            {/* Left sidebar: Feature list */}
            <div
              className={`w-64 flex-shrink-0 space-y-3 overflow-y-auto ${
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
                  className={`flex flex-col rounded-lg border border-gray-200 bg-white lg:flex-[6] ${
                    mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex'
                  }`}
                >
                  <DocumentTypeNav
                    documents={activeFeature.documents}
                    activeDocType={activeDocType}
                    onSelect={handleDocTypeSelect}
                  />
                  <KiroChat
                    key={`${activeFeatureId}-${activeDocType}`}
                    projectId={projectId}
                    featureId={activeFeature.id}
                    docType={activeDocType}
                    docStatus={currentDoc?.status ?? null}
                    initialMessages={currentConversation}
                    hasDocument={currentDoc !== null}
                    onDocumentGenerated={handleDocumentGenerated}
                    onDocumentApproved={handleDocumentApproved}
                  />
                </div>

                {/* Right: Document panel */}
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
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white">
                <div className="text-center">
                  <p className="text-sm text-gray-500">
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
