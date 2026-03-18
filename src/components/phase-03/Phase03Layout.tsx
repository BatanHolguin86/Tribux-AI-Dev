'use client'

import { useState, useCallback } from 'react'
import type { SectionStatus } from '@/types/conversation'
import { PHASE03_SECTIONS } from '@/lib/ai/prompts/phase-03'
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

      // Optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.key === sectionKey ? { ...c, status: newStatus } : c))
      )

      const res = await fetch(`/api/projects/${projectId}/phases/3/sections/${sectionKey}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        // Revert on error
        setCategories((prev) =>
          prev.map((c) => (c.key === sectionKey ? { ...c, status: category.status } : c))
        )
      }
    },
    [categories, projectId]
  )

  return (
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
          <p className="mb-4 text-sm text-gray-500">
            Completa cada categoria marcandola cuando hayas configurado todos los items.
            Si te atoras, abre el chat del CTO (boton flotante) y pide el plan de Phase 03.
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
}
