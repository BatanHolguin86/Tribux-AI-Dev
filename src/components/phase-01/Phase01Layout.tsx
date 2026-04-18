'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { KiroDocumentType } from '@/types/feature'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { useFounderMode, founderLabel } from '@/hooks/useFounderMode'
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

const phaseAgents = getPhaseAgents(1)

export function Phase01Layout({
  projectId,
  features: initialFeatures,
  discoverySummary,
}: Phase01LayoutProps) {
  const router = useRouter()
  const { isFounder } = useFounderMode()
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
    router.refresh()
  }, [router])

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  // Feature workspace (selected feature) — full screen, bypasses tabs
  if (activeFeature) {
    return (
      <div className="h-[var(--content-height)]">
        <FeatureWorkspace
          projectId={projectId}
          feature={activeFeature}
          onBack={handleBack}
          onDocumentGenerated={handleRefresh}
        />
      </div>
    )
  }

  const sectionsContent = (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {founderLabel('KIRO Specs', isFounder)}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {isFounder
              ? 'Define que hace cada parte de tu producto'
              : 'Define requisitos, diseno y tasks para cada feature'}
          </p>
        </div>
        {features.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-1.5 rounded-full bg-[#0F2B46] transition-all"
                  style={{ width: `${(completedFeatures / features.length) * 100}%` }}
                />
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              completedFeatures === features.length && features.length > 0
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {completedFeatures}/{features.length}
            </span>
          </div>
        )}
      </div>

      {/* Discovery context */}
      <DiscoverySummary docs={discoverySummary} />

      {allSpecComplete ? (
        <Phase01FinalGate
          projectId={projectId}
          features={features.map((f) => ({ name: f.name, status: f.status }))}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
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
            onFeatureAdded={handleRefresh}
          />

          <FeatureSuggestions
            projectId={projectId}
            onAccepted={handleRefresh}
          />
        </div>
      )}
    </div>
  )

  return (
    <PhaseWorkspaceTabs
      phaseNumber={1}
      projectId={projectId}
      phaseAgents={phaseAgents}
      teamContent={(goToSecciones) => (
        <PhaseTeamPanel
          projectId={projectId}
          phaseNumber={1}
          agentTypes={phaseAgents}
          onGoToSecciones={goToSecciones}
        />
      )}
    >
      {sectionsContent}
    </PhaseWorkspaceTabs>
  )
}
