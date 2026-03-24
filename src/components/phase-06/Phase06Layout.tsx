'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { SectionStatus } from '@/types/conversation'
import type { PhaseChecklistCategory } from '@/lib/phase-checklist-sections'
import { PHASE06_SECTIONS, CATEGORY_CONFIGS } from '@/lib/ai/prompts/phase-06'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { ChecklistCard } from '@/components/shared/ChecklistCard'
import { Phase06FinalGate } from './Phase06FinalGate'
import { PhaseDocsCallout } from '@/components/shared/PhaseDocsCallout'

const PHASE_OBJECTIVE =
  'Verifica checklist de lanzamiento: deploy, monitoring, dominios y documentación operacional.'

type Phase06LayoutProps = {
  projectId: string
  categories: PhaseChecklistCategory[]
}

const phaseAgents = getPhaseAgents(6)

export function Phase06Layout({ projectId, categories: initialCategories }: Phase06LayoutProps) {
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
        title="Launch & Deployment"
        completedCount={completedCount}
        totalCount={totalCategories}
        objective={PHASE_OBJECTIVE}
      />

      {allCompleted ? (
        <Phase06FinalGate projectId={projectId} />
      ) : (
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

          <div className="grid gap-4 md:grid-cols-2">
            {PHASE06_SECTIONS.map((sectionKey) => {
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
      phaseNumber={6}
      projectId={projectId}
      phaseAgents={phaseAgents}
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
