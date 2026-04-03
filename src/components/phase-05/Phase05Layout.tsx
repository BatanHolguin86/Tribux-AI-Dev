'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { SectionStatus } from '@/types/conversation'
import type { PhaseChecklistCategory } from '@/lib/phase-checklist-sections'
import type { ActionExecution } from '@/types/action'
import { PHASE05_SECTIONS, CATEGORY_CONFIGS } from '@/lib/ai/prompts/phase-05'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { usePhaseActions } from '@/hooks/usePhaseActions'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { AutomatedChecklistCard } from '@/components/shared/AutomatedChecklistCard'
import { ActionStreamingPanel } from '@/components/shared/ActionStreamingPanel'
import { Phase05FinalGate } from './Phase05FinalGate'
import { CIStatusWidget } from './CIStatusWidget'
import { PhaseDocsCallout } from '@/components/shared/PhaseDocsCallout'
import { PhaseChatPanel } from '@/components/shared/PhaseChatPanel'
import { useFounderMode } from '@/hooks/useFounderMode'

const PHASE_OBJECTIVE =
  'Completa tests unitarios, de integración y E2E; genera el reporte de QA antes de aprobar la fase.'

type Phase05LayoutProps = {
  projectId: string
  categories: PhaseChecklistCategory[]
  initialMessages: Array<{ role: string; content: string; created_at?: string }>
  initialExecutions?: ActionExecution[]
}

const phaseAgents = getPhaseAgents(5)

export function Phase05Layout({ projectId, categories: initialCategories, initialMessages, initialExecutions = [] }: Phase05LayoutProps) {
  const [categories, setCategories] = useState(initialCategories)
  const {
    actions,
    executions,
    executingAction,
    streamingContent,
    executeAction,
    commitGeneratedFiles,
    resetStreaming,
  } = usePhaseActions(projectId, 5, initialExecutions)

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

      const res = await fetch(`/api/projects/${projectId}/phases/5/sections/${sectionKey}/item`, {
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

      const res = await fetch(`/api/projects/${projectId}/phases/5/sections/${sectionKey}/toggle`, {
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

  const { hideCode, isPM } = useFounderMode()

  // PM Mode: simplified testing view — "Pasa / No pasa" instead of checklists
  const pmTestingView = (hideCode && !allCompleted) ? (
    <div>
      <PhaseProgressHeader
        title="Testing & QA"
        completedCount={completedCount}
        totalCount={totalCategories}
        objective="Verificacion automatica de que tu app funciona correctamente."
      />

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#1E3A55] dark:bg-[#0F2B46]">
        <div className="mb-4">
          <CIStatusWidget projectId={projectId} />
        </div>

        <div className="space-y-3">
          {categories.map((cat) => {
            const isDone = cat.status === 'completed' || cat.status === 'approved'
            return (
              <div key={cat.key} className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-4 py-3 dark:border-[#1E3A55]">
                <span className="text-sm text-[#0F2B46] dark:text-gray-200">
                  {isPM ? cat.label : cat.label.replace('Unit Tests', 'Verificaciones basicas').replace('Integration Tests', 'Verificaciones de conexion').replace('E2E Tests', 'Verificaciones completas').replace('Test Plan', 'Plan de verificacion').replace('QA Report', 'Reporte de calidad')}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isDone
                    ? 'bg-[#10B981]/10 text-[#10B981]'
                    : 'bg-[#94A3B8]/10 text-[#94A3B8]'
                }`}>
                  {isDone ? '✓ Pasa' : 'Pendiente'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-4 rounded-lg bg-[#F8FAFC] p-3 dark:bg-[#0A1F33]">
          <p className="text-xs text-[#94A3B8]">
            Las verificaciones se ejecutan automaticamente via CI cuando el codigo se construye.
            {isPM && ' Tu equipo de ingenieria puede ver el detalle en la tab Equipo.'}
          </p>
        </div>
      </div>
    </div>
  ) : null

  const sectionsContent = (
    <div>
      <PhaseProgressHeader
        title="Testing & QA"
        completedCount={completedCount}
        totalCount={totalCategories}
        objective={PHASE_OBJECTIVE}
      />

      {allCompleted ? (
        <Phase05FinalGate projectId={projectId} />
      ) : pmTestingView ? (
        pmTestingView
      ) : (
        <>
          <PhaseDocsCallout
            title="QA en el repositorio"
            description="Listado de suites y flujos E2E documentados en markdown."
            repoPaths={[
              { label: 'E2E y estructura de tests', path: 'docs/05-qa/e2e-tests.md' },
              { label: 'Go/No-go v1', path: 'docs/05-qa/v1-go-no-go.md' },
              { label: 'Smoke staging', path: 'docs/05-qa/smoke-staging-phase00-phase01.md' },
            ]}
            commands={['pnpm test', 'pnpm test:e2e']}
          />
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Marca items hechos (persisten por proyecto); luego cierra cada categoria. Tab{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">Equipo</span> para QA Engineer.
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
            {PHASE05_SECTIONS.map((sectionKey) => {
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
                  {sectionKey === 'integration_tests' && (
                    <CIStatusWidget projectId={projectId} />
                  )}
                </div>
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
      phaseNumber={5}
      initialMessages={initialMessages}
    />
  )

  return (
    <PhaseWorkspaceTabs
      phaseNumber={5}
      projectId={projectId}
      phaseAgents={phaseAgents}
      hasTools
      toolsContent={chatContent}
      teamContent={(goToSecciones) => (
        <PhaseTeamPanel
          projectId={projectId}
          phaseNumber={5}
          agentTypes={phaseAgents}
          onGoToSecciones={goToSecciones}
        />
      )}
    >
      {sectionsContent}
    </PhaseWorkspaceTabs>
  )
}
