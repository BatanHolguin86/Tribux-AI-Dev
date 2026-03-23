'use client'

import { useState, useCallback } from 'react'
import type { KiroDocumentType } from '@/types/feature'
import { FeatureList } from './FeatureList'
import { FeatureSuggestions } from './FeatureSuggestions'
import { DiscoverySummary } from './DiscoverySummary'
import { FeatureWorkspace } from './FeatureWorkspace'
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
  const [features] = useState(initialFeatures)
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null)

  const activeFeature = features.find((f) => f.id === activeFeatureId)

  const allSpecComplete = features.length > 0 && features.every(
    (f) => f.status === 'spec_complete' || f.status === 'approved',
  )

  const completedFeatures = features.filter(
    (f) => f.status === 'spec_complete' || f.status === 'approved',
  ).length

  const handleFeatureSelect = useCallback((featureId: string) => {
    setActiveFeatureId(featureId)
  }, [])

  const handleBack = useCallback(() => {
    setActiveFeatureId(null)
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

  // --- Feature Workspace view ---
  if (activeFeature) {
    return (
      <div className="h-[var(--content-height)]">
        <FeatureWorkspace
          projectId={projectId}
          feature={activeFeature}
          onBack={handleBack}
          onDocumentGenerated={handleDocumentGenerated}
          onDocumentApproved={handleDocumentApproved}
        />
      </div>
    )
  }

  // --- Feature list view (default) ---
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

      <details className="mb-4 rounded-lg border border-gray-100 bg-gray-50/50 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
        <summary className="cursor-pointer px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
          ¿Qué es Phase 01? (una frase)
        </summary>
        <p className="border-t border-gray-100 px-3 py-2 leading-relaxed dark:border-gray-800">
          Un feature a la vez: <span className="font-medium text-gray-700 dark:text-gray-300">3 pestañas</span>{' '}
          (Requisitos → Diseño → Tasks), siempre con <span className="font-medium">aprobar</span> antes de la
          siguiente. El CTO te acompaña en el chat del centro.
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
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Feature cards */}
          <div>
            <FeatureList
              projectId={projectId}
              features={features.map((f) => ({
                id: f.id,
                name: f.name,
                status: f.status,
                documents: f.documents,
              }))}
              activeFeatureId={null}
              onSelect={handleFeatureSelect}
              onFeatureAdded={handleFeaturesRefresh}
            />
          </div>

          {/* Suggestions sidebar */}
          <div>
            <FeatureSuggestions
              projectId={projectId}
              onAccepted={handleFeaturesRefresh}
            />
          </div>
        </div>
      )}
    </div>
  )
}
