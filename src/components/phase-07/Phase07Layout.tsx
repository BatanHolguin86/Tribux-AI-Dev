'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { SectionStatus } from '@/types/conversation'
import { PHASE07_SECTIONS, CATEGORY_CONFIGS } from '@/lib/ai/prompts/phase-07'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { ChecklistCard } from '@/components/shared/ChecklistCard'
import { Phase07FinalGate } from './Phase07FinalGate'

const PHASE_OBJECTIVE =
  'Recopila feedback, analiza métricas y planifica el siguiente ciclo del producto.'

type CategoryData = {
  key: string
  label: string
  status: SectionStatus
}

type Phase07LayoutProps = {
  projectId: string
  categories: CategoryData[]
}

export function Phase07Layout({ projectId, categories: initialCategories }: Phase07LayoutProps) {
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

  return (
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
          <p className="mb-4 text-sm text-gray-500">
            Completa cada categoria de iteracion. Recopila feedback, analiza metricas y planifica el siguiente ciclo.
          </p>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <span>
              Si necesitas definir el siguiente ciclo con claridad, abre el chat del <span className="font-medium">CTO Virtual</span> y pide el plan de Phase 07.
            </span>
            <Link
              href={`/projects/${projectId}/agents`}
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700"
            >
              Abrir chat del CTO
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {PHASE07_SECTIONS.map((sectionKey) => {
              const category = categories.find((c) => c.key === sectionKey)!
              return (
                <ChecklistCard
                  key={sectionKey}
                  config={CATEGORY_CONFIGS[sectionKey]}
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
