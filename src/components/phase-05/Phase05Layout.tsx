'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { SectionStatus } from '@/types/conversation'
import { PHASE05_SECTIONS, CATEGORY_CONFIGS } from '@/lib/ai/prompts/phase-05'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { ChecklistCard } from '@/components/shared/ChecklistCard'
import { Phase05FinalGate } from './Phase05FinalGate'
import Link from 'next/link'

const PHASE_OBJECTIVE =
  'Completa tests unitarios, de integración y E2E; genera el reporte de QA antes de aprobar la fase.'

type CategoryData = {
  key: string
  label: string
  status: SectionStatus
}

type Phase05LayoutProps = {
  projectId: string
  categories: CategoryData[]
}

export function Phase05Layout({ projectId, categories: initialCategories }: Phase05LayoutProps) {
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

      const res = await fetch(`/api/projects/${projectId}/phases/5/sections/${sectionKey}/toggle`, {
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
        title="Testing & QA"
        completedCount={completedCount}
        totalCount={totalCategories}
        objective={PHASE_OBJECTIVE}
      />

      {allCompleted ? (
        <Phase05FinalGate projectId={projectId} />
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Completa cada categoria de testing y QA. Marca como completada cuando hayas verificado todos los items.
          </p>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <span>
              ¿Dudas sobre qué correr primero? Habla con el <span className="font-medium">CTO Virtual</span> y pide el plan de Phase 05.
            </span>
            <Link
              href={`/projects/${projectId}/agents`}
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700"
            >
              Abrir chat del CTO
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {PHASE05_SECTIONS.map((sectionKey) => {
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
