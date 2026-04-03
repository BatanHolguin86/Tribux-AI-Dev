'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { SectionStatus } from '@/types/conversation'
import type { PhaseChecklistCategory } from '@/lib/phase-checklist-sections'
import type { ActionExecution } from '@/types/action'
import { PHASE03_SECTIONS, CATEGORY_CONFIGS } from '@/lib/ai/prompts/phase-03'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { usePhaseActions } from '@/hooks/usePhaseActions'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { AutomatedChecklistCard } from '@/components/shared/AutomatedChecklistCard'
import { ActionStreamingPanel } from '@/components/shared/ActionStreamingPanel'
import { Phase03FinalGate } from './Phase03FinalGate'
import { InfraReadinessBanner } from './InfraReadinessBanner'
import { OneClickSetupCard } from './OneClickSetupCard'
import { PhaseDocsCallout } from '@/components/shared/PhaseDocsCallout'
import { useFounderMode } from '@/hooks/useFounderMode'
import { PhaseChatPanel } from '@/components/shared/PhaseChatPanel'

const PHASE_OBJECTIVE =
  'Configura repositorio, base de datos, autenticación, hosting y variables de entorno antes de pasar a desarrollo.'

type Phase03LayoutProps = {
  projectId: string
  categories: PhaseChecklistCategory[]
  initialMessages: Array<{ role: string; content: string; created_at?: string }>
  initialExecutions?: ActionExecution[]
  platformReady?: boolean
  existingSetup?: { hasRepo: boolean; hasSupabase: boolean; hasVercel: boolean }
}

const phaseAgents = getPhaseAgents(3)

export function Phase03Layout({ projectId, categories: initialCategories, initialMessages, initialExecutions = [], platformReady = false, existingSetup = { hasRepo: false, hasSupabase: false, hasVercel: false } }: Phase03LayoutProps) {
  const { isFounder } = useFounderMode()
  const allSetupDone = existingSetup.hasRepo && existingSetup.hasSupabase && existingSetup.hasVercel
  const [categories, setCategories] = useState(initialCategories)
  const {
    actions,
    executions,
    executingAction,
    streamingContent,
    executeAction,
    commitGeneratedFiles,
    resetStreaming,
  } = usePhaseActions(projectId, 3, initialExecutions)

  const completedCount = categories.filter(
    (c) => c.status === 'completed' || c.status === 'approved',
  ).length
  const totalCategories = categories.length
  const allCompleted = categories.every((c) => c.status === 'completed' || c.status === 'approved')

  const handleItemToggle = useCallback(
    async (sectionKey: string, itemIndex: number) => {
      const category = categories.find((c) => c.key === sectionKey)
      if (!category || category.status === 'completed' || category.status === 'approved') return

      const current = category.itemStates[itemIndex] === true
      const next = !current

      setCategories((prev) =>
        prev.map((c) =>
          c.key === sectionKey ? { ...c, itemStates: { ...c.itemStates, [itemIndex]: next } } : c,
        ),
      )

      const res = await fetch(`/api/projects/${projectId}/phases/3/sections/${sectionKey}/item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIndex, completed: next }),
      })

      if (!res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.key === sectionKey ? { ...c, itemStates: category.itemStates } : c)),
        )
        toast.error('No se pudo guardar el item')
      }
    },
    [categories, projectId],
  )

  const handleToggle = useCallback(
    async (sectionKey: string) => {
      const category = categories.find((c) => c.key === sectionKey)
      if (!category) return

      const newStatus: SectionStatus =
        category.status === 'completed' || category.status === 'approved' ? 'pending' : 'completed'

      setCategories((prev) =>
        prev.map((c) => (c.key === sectionKey ? { ...c, status: newStatus } : c)),
      )

      const res = await fetch(`/api/projects/${projectId}/phases/3/sections/${sectionKey}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.key === sectionKey ? { ...c, status: category.status } : c)),
        )
      }
    },
    [categories, projectId],
  )

  const sectionsContent = (
    <div>
      <PhaseProgressHeader
        title="Environment Setup"
        completedCount={completedCount}
        totalCount={totalCategories}
        objective={PHASE_OBJECTIVE}
      />

      {allCompleted ? (
        <Phase03FinalGate projectId={projectId} />
      ) : (
        <>
          <OneClickSetupCard
            projectId={projectId}
            platformReady={platformReady}
            existingSetup={existingSetup}
          />
          <InfraReadinessBanner projectId={projectId} />
          <PhaseDocsCallout
            title="Documentación en el repositorio"
            description="Runbooks e infraestructura (clona el repo o ábrelo en el IDE)."
            repoPaths={[
              { label: 'Entorno y variables', path: 'docs/03-environment/README.md' },
              { label: 'Migraciones staging', path: 'docs/06-ops/apply-migrations-staging.md' },
              { label: 'Go/No-go v1 (QA)', path: 'docs/05-qa/v1-go-no-go.md' },
              { label: 'Infra', path: 'infrastructure/supabase/migrations/' },
            ]}
          />
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Marca cada <strong className="font-medium text-gray-700 dark:text-gray-300">item</strong> al completarlo
            (se guarda por proyecto). Cuando la categoria este lista, usa{' '}
            <strong className="font-medium text-gray-700 dark:text-gray-300">Marcar como completada</strong>. Si te
            atoras, usa el tab{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">Equipo</span> para CTO o DevOps.
          </p>

          {streamingContent && (
            <div className="mb-4">
              <ActionStreamingPanel
                content={streamingContent}
                isStreaming={!!executingAction}
                onApplyToRepo={() => commitGeneratedFiles(executingAction ?? '')}
                onClose={resetStreaming}
                title="Resultado de automatizacion"
              />
            </div>
          )}

          <div className={`grid gap-4 md:grid-cols-2 ${isFounder && allSetupDone ? 'hidden' : ''}`}>
            {PHASE03_SECTIONS.map((sectionKey) => {
              const category = categories.find((c) => c.key === sectionKey)!
              const action = actions.find((a) => a.section === sectionKey)
              const sectionExecutions = executions.filter((e) => e.section === sectionKey)
              return (
                <AutomatedChecklistCard
                  key={sectionKey}
                  sectionKey={sectionKey}
                  config={CATEGORY_CONFIGS[sectionKey]}
                  status={category.status}
                  itemStates={category.itemStates}
                  onItemToggle={handleItemToggle}
                  onToggle={() => handleToggle(sectionKey)}
                  action={action}
                  executions={sectionExecutions}
                  onActionExecute={executeAction}
                  executingAction={executingAction}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )

  const chatContent = (
    <PhaseChatPanel
      projectId={projectId}
      phaseNumber={3}
      initialMessages={initialMessages}
    />
  )

  return (
    <PhaseWorkspaceTabs
      phaseNumber={3}
      projectId={projectId}
      phaseAgents={phaseAgents}
      hasTools
      toolsContent={chatContent}
      teamContent={(goToSecciones) => (
        <PhaseTeamPanel
          projectId={projectId}
          phaseNumber={3}
          agentTypes={phaseAgents}
          onGoToSecciones={goToSecciones}
        />
      )}
    >
      {sectionsContent}
    </PhaseWorkspaceTabs>
  )
}
