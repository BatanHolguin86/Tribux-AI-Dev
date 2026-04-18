'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { SectionStatus } from '@/types/conversation'
import type { PhaseChecklistCategory } from '@/lib/phase-checklist-sections'
import type { ActionExecution } from '@/types/action'
import { PHASE06_SECTIONS, CATEGORY_CONFIGS } from '@/lib/ai/prompts/phase-06'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { usePhaseActions } from '@/hooks/usePhaseActions'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { AutomatedChecklistCard } from '@/components/shared/AutomatedChecklistCard'
import { ActionStreamingPanel } from '@/components/shared/ActionStreamingPanel'
import { Phase06FinalGate } from './Phase06FinalGate'
import { DeployStatusWidget } from './DeployStatusWidget'
import { ReadinessCheckWidget } from './ReadinessCheckWidget'
import { PhaseDocsCallout } from '@/components/shared/PhaseDocsCallout'
import { PhaseChatPanel } from '@/components/shared/PhaseChatPanel'
import { ExportTransferButton } from '@/components/shared/ExportTransferButton'
import { useFounderMode, founderLabel } from '@/hooks/useFounderMode'

const PHASE_OBJECTIVE =
  'Verifica checklist de lanzamiento: deploy, monitoring, dominios y documentación operacional.'

type Phase06LayoutProps = {
  projectId: string
  categories: PhaseChecklistCategory[]
  initialMessages: Array<{ role: string; content: string; created_at?: string }>
  initialExecutions?: ActionExecution[]
}

const phaseAgents = getPhaseAgents(6)

export function Phase06Layout({ projectId, categories: initialCategories, initialMessages, initialExecutions = [] }: Phase06LayoutProps) {
  const { isFounder, hideChecklists } = useFounderMode()
  const [categories, setCategories] = useState(initialCategories)
  const {
    actions,
    executions,
    executingAction,
    streamingContent,
    executeAction,
    commitGeneratedFiles,
    resetStreaming,
  } = usePhaseActions(projectId, 6, initialExecutions)

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

      const res = await fetch(`/api/projects/${projectId}/phases/6/sections/${sectionKey}/item`, {
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

      const res = await fetch(`/api/projects/${projectId}/phases/6/sections/${sectionKey}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.key === sectionKey ? { ...c, status: category.status } : c)),
        )
        toast.error('Error al actualizar la categoria')
      }
    },
    [categories, projectId],
  )

  const sectionsContent = (
    <div>
      <PhaseProgressHeader
        title={founderLabel('Launch & Deployment', isFounder)}
        completedCount={completedCount}
        totalCount={totalCategories}
        objective={isFounder
          ? 'Tu producto esta casi listo para que el mundo lo vea.'
          : PHASE_OBJECTIVE}
      />

      {allCompleted ? (
        <Phase06FinalGate projectId={projectId} />
      ) : (
        <>
          <ReadinessCheckWidget projectId={projectId} />

          {hideChecklists ? (
            /* Founder view: simplified launch status */
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="font-display text-sm font-semibold text-[#0F2B46] dark:text-white">
                  Estado del lanzamiento
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Tu equipo IA esta preparando todo para publicar tu producto.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <div
                      key={cat.key}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                        cat.status === 'completed' || cat.status === 'approved'
                          ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/10'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <span className={`text-sm ${cat.status === 'completed' || cat.status === 'approved' ? 'text-green-500' : 'text-gray-400'}`}>
                        {cat.status === 'completed' || cat.status === 'approved' ? '✓' : '○'}
                      </span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {founderLabel((CATEGORY_CONFIGS as Record<string, { title: string }>)[cat.key]?.title ?? cat.key, isFounder)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <DeployStatusWidget projectId={projectId} />

              {streamingContent && (
                <ActionStreamingPanel
                  content={streamingContent}
                  isStreaming={!!executingAction}
                  onApplyToRepo={() => commitGeneratedFiles(executingAction ?? '')}
                  onClose={resetStreaming}
                  title="Resultado"
                />
              )}

              <ExportTransferButton projectId={projectId} />
            </div>
          ) : (
            /* Technical view: full checklists + docs */
            <>
              <PhaseDocsCallout
                title="Operaciones en el repositorio"
                description="Runbooks para deploy, migraciones y observabilidad."
                repoPaths={[
                  { label: 'Migraciones staging', path: 'docs/06-ops/apply-migrations-staging.md' },
                  { label: 'Sentry', path: 'docs/06-ops/sentry-setup.md' },
                  { label: 'Go/No-go v1 (pre-lanzamiento)', path: 'docs/05-qa/v1-go-no-go.md' },
                ]}
              />

              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Items y categorias se guardan por proyecto. Parte del deploy puede ser manual (Vercel, DNS, etc.); usa los
                runbooks y el tab{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">Equipo</span> para DevOps.
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

              <div className="grid gap-4 md:grid-cols-2">
                {PHASE06_SECTIONS.map((sectionKey) => {
                  const category = categories.find((c) => c.key === sectionKey)!
                  const action = actions.find((a) => a.section === sectionKey)
                  const sectionExecutions = executions.filter((e) => e.section === sectionKey)
                  return (
                    <div key={sectionKey}>
                      <AutomatedChecklistCard
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
                      {sectionKey === 'deploy_production' && (
                        <DeployStatusWidget projectId={projectId} />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6">
                <ExportTransferButton projectId={projectId} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )

  const chatContent = (
    <PhaseChatPanel
      projectId={projectId}
      phaseNumber={6}
      initialMessages={initialMessages}
    />
  )

  return (
    <PhaseWorkspaceTabs
      phaseNumber={6}
      projectId={projectId}
      phaseAgents={phaseAgents}
      hasTools
      toolsContent={chatContent}
      teamContent={(goToSecciones) => (
        <PhaseTeamPanel
          projectId={projectId}
          phaseNumber={6}
          agentTypes={phaseAgents}
          onGoToSecciones={goToSecciones}
        />
      )}
    >
      {sectionsContent}
    </PhaseWorkspaceTabs>
  )
}
