'use client'

import { useState, useCallback } from 'react'
import type { SectionStatus } from '@/types/conversation'
import { PHASE03_SECTIONS } from '@/lib/ai/prompts/phase-03'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { ChecklistCategory } from './ChecklistCategory'
import { Phase03FinalGate } from './Phase03FinalGate'

const PHASE_OBJECTIVE =
  'Configura repositorio, base de datos, autenticación, hosting y variables de entorno antes de pasar a desarrollo.'

type CategoryData = {
  key: string
  label: string
  status: SectionStatus
}

type Phase03LayoutProps = {
  projectId: string
  categories: CategoryData[]
}

const phaseAgents = getPhaseAgents(3)

export function Phase03Layout({ projectId, categories: initialCategories }: Phase03LayoutProps) {
  const [categories, setCategories] = useState(initialCategories)

  const completedCount = categories.filter((c) => c.status === 'completed' || c.status === 'approved').length
  const totalCategories = categories.length
  const allCompleted = categories.every((c) => c.status === 'completed' || c.status === 'approved')

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

      const res = await fetch(`/api/projects/${projectId}/phases/3/sections/${sectionKey}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.key === sectionKey ? { ...c, status: category.status } : c))
        )
      }
    },
    [categories, projectId]
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
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Completa cada categoria marcandola cuando hayas configurado todos los items.
            Si te atoras, usa el tab <span className="font-medium text-gray-700 dark:text-gray-300">Equipo</span> para consultar al CTO o DevOps.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {PHASE03_SECTIONS.map((sectionKey) => {
              const category = categories.find((c) => c.key === sectionKey)!
              return (
                <ChecklistCategory
                  key={sectionKey}
                  sectionKey={sectionKey}
                  status={category.status}
                  onToggle={() => handleToggle(sectionKey)}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )

  const teamContent = (
    <PhaseTeamPanel
      projectId={projectId}
      phaseNumber={3}
      agentTypes={phaseAgents}
    />
  )

  return (
    <PhaseWorkspaceTabs
      phaseNumber={3}
      projectId={projectId}
      phaseAgents={phaseAgents}
      teamContent={teamContent}
    >
      {sectionsContent}
    </PhaseWorkspaceTabs>
  )
}
