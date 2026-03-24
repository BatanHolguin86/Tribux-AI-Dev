'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { SectionStatus } from '@/types/conversation'
import type { PhaseChecklistCategory } from '@/lib/phase-checklist-sections'
import { PHASE03_SECTIONS } from '@/lib/ai/prompts/phase-03'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { ChecklistCategory } from './ChecklistCategory'
import { Phase03FinalGate } from './Phase03FinalGate'
import { PhaseDocsCallout } from '@/components/shared/PhaseDocsCallout'

const PHASE_OBJECTIVE =
  'Configura repositorio, base de datos, autenticación, hosting y variables de entorno antes de pasar a desarrollo.'

type Phase03LayoutProps = {
  projectId: string
  categories: PhaseChecklistCategory[]
}

const phaseAgents = getPhaseAgents(3)

export function Phase03Layout({ projectId, categories: initialCategories }: Phase03LayoutProps) {
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

          <div className="grid gap-4 md:grid-cols-2">
            {PHASE03_SECTIONS.map((sectionKey) => {
              const category = categories.find((c) => c.key === sectionKey)!
              return (
                <ChecklistCategory
                  key={sectionKey}
                  sectionKey={sectionKey}
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
      phaseNumber={3}
      projectId={projectId}
      phaseAgents={phaseAgents}
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
