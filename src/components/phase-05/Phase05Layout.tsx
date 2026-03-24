'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { SectionStatus } from '@/types/conversation'
import type { PhaseChecklistCategory } from '@/lib/phase-checklist-sections'
import { PHASE05_SECTIONS, CATEGORY_CONFIGS } from '@/lib/ai/prompts/phase-05'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { ChecklistCard } from '@/components/shared/ChecklistCard'
import { Phase05FinalGate } from './Phase05FinalGate'
import { PhaseDocsCallout } from '@/components/shared/PhaseDocsCallout'

const PHASE_OBJECTIVE =
  'Completa tests unitarios, de integración y E2E; genera el reporte de QA antes de aprobar la fase.'

type Phase05LayoutProps = {
  projectId: string
  categories: PhaseChecklistCategory[]
}

const phaseAgents = getPhaseAgents(5)

export function Phase05Layout({ projectId, categories: initialCategories }: Phase05LayoutProps) {
  const [categories, setCategories] = useState(initialCategories)

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

          <div className="grid gap-4 md:grid-cols-2">
            {PHASE05_SECTIONS.map((sectionKey) => {
              const category = categories.find((c) => c.key === sectionKey)!
              return (
                <ChecklistCard
                  key={sectionKey}
                  sectionKey={sectionKey}
                  config={CATEGORY_CONFIGS[sectionKey]}
                  status={category.status}
                  itemStates={category.itemStates}
                  onItemToggle={handleItemToggle}
                  onToggle={() => handleToggle(sectionKey)}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )

  return (
    <PhaseWorkspaceTabs
      phaseNumber={5}
      projectId={projectId}
      phaseAgents={phaseAgents}
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
