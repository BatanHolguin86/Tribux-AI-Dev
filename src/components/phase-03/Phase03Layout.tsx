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

  const { hideChecklists: isFounderMode, isPM, isConsultor } = useFounderMode()

  // ── Founder view: only OneClickSetup + result ──
  const founderContent = (
    <div>
      <PhaseProgressHeader
        title="Environment Setup"
        completedCount={allSetupDone ? totalCategories : 0}
        totalCount={totalCategories}
        objective="Preparar la infraestructura de tu app con un solo click."
      />

      {allSetupDone ? (
        <div className="rounded-xl border-2 border-[#10B981]/30 bg-[#10B981]/5 p-6 text-center">
          <div className="mb-3 text-4xl">✅</div>
          <h3 className="font-display text-lg font-display font-bold text-[#0F2B46] dark:text-white">Tu app esta lista</h3>
          <div className="mt-4 flex justify-center gap-3">
            {[
              { label: 'Codigo', done: existingSetup.hasRepo },
              { label: 'Base de datos', done: existingSetup.hasSupabase },
              { label: 'Hosting', done: existingSetup.hasVercel },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#10B981] shadow-sm dark:bg-[#0F2B46]">
                ✓ {item.label}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#94A3B8]">La infraestructura esta configurada. Continua a construir tu app.</p>
        </div>
      ) : (
        <OneClickSetupCard
          projectId={projectId}
          platformReady={platformReady}
          existingSetup={existingSetup}
        />
      )}
    </div>
  )

  // ── PM view: OneClickSetup + collapsible checklists ──
  const pmContent = (
    <div>
      <PhaseProgressHeader
        title="Environment Setup"
        completedCount={completedCount}
        totalCount={totalCategories}
        objective="Configurar la infraestructura del proyecto."
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

          <details className="mt-4">
            <summary className="cursor-pointer rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#0F2B46] hover:bg-[#E8F4F8] dark:border-[#1E3A55] dark:bg-[#0F2B46] dark:text-gray-200">
              Ver detalle tecnico ({completedCount}/{totalCategories} categorias)
            </summary>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
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
          </details>
        </>
      )}
    </div>
  )

  // ── Consultor view: full technical detail ──
  const consultorContent = (
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
          <p className="mb-4 text-sm text-[#94A3B8]">
            Marca cada item al completarlo. Cuando la categoria este lista, usa Marcar como completada.
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

  // Select content based on persona
  const sectionsContent = isFounderMode ? founderContent : isPM ? pmContent : consultorContent

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
