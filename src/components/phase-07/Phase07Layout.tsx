'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { SectionStatus } from '@/types/conversation'
import type { PhaseChecklistCategory } from '@/lib/phase-checklist-sections'
import { PHASE07_SECTIONS, CATEGORY_CONFIGS } from '@/lib/ai/prompts/phase-07'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { ChecklistCard } from '@/components/shared/ChecklistCard'
import { Phase07FinalGate } from './Phase07FinalGate'
import { PhaseDocsCallout } from '@/components/shared/PhaseDocsCallout'

const PHASE_OBJECTIVE =
  'Recopila feedback, analiza métricas y planifica el siguiente ciclo del producto.'

type Phase07LayoutProps = {
  projectId: string
  categories: PhaseChecklistCategory[]
}

const phaseAgents = getPhaseAgents(7)

export function Phase07Layout({ projectId, categories: initialCategories }: Phase07LayoutProps) {
  const [categories, setCategories] = useState(initialCategories)

  const completedCount = categories.filter((c) => c.status === 'completed' || c.status === 'approved').length
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

      const res = await fetch(`/api/projects/${projectId}/phases/7/sections/${sectionKey}/item`, {
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
        category.status === 'completed' || category.status === 'approved'
          ? 'pending'
          : 'completed'

      setCategories((prev) =>
        prev.map((c) => (c.key === sectionKey ? { ...c, status: newStatus } : c))
      )

      const res = await fetch(`/api/projects/${projectId}/phases/7/sections/${sectionKey}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.key === sectionKey ? { ...c, status: category.status } : c))
        )
        toast.error('Error al actualizar la categoria')
      }
    },
    [categories, projectId]
  )

  const sectionsContent = (
    <div>
      <PhaseProgressHeader
        title="Iteration & Growth"
        completedCount={completedCount}
        totalCount={totalCategories}
        objective={PHASE_OBJECTIVE}
      />

      {allCompleted ? (
        <Phase07FinalGate projectId={projectId} />
      ) : (
        <>
          <PhaseDocsCallout
            title="Documentación de producto y métricas"
            description="La iteración combina feedback, datos y backlog; parte del trabajo vive fuera de la app."
            repoPaths={[
              { label: 'Métricas y discovery', path: 'docs/00-discovery/04-metrics.md' },
              { label: 'Brief y roadmap', path: 'docs/00-discovery/01-brief.md' },
              { label: 'Índice docs', path: 'docs/README.md' },
            ]}
          />
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Marca items y categorias (persistente). Tab{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">Equipo</span> para Product Architect.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {PHASE07_SECTIONS.map((sectionKey) => {
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
      phaseNumber={7}
      projectId={projectId}
      phaseAgents={phaseAgents}
      teamContent={(goToSecciones) => (
        <PhaseTeamPanel
          projectId={projectId}
          phaseNumber={7}
          agentTypes={phaseAgents}
          onGoToSecciones={goToSecciones}
        />
      )}
    >
      {sectionsContent}
    </PhaseWorkspaceTabs>
  )
}
