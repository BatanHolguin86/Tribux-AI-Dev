'use client'

import { useState, useCallback } from 'react'
import type { SectionStatus } from '@/types/conversation'
import { PHASE05_SECTIONS, CATEGORY_CONFIGS } from '@/lib/ai/prompts/phase-05'
import { ChecklistCard } from '@/components/shared/ChecklistCard'
import { Phase05FinalGate } from './Phase05FinalGate'

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
      }
    },
    [categories, projectId]
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Testing & QA</h2>
          <p className="text-sm text-gray-600">
            {completedCount} de {totalCategories} categorias completadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-violet-600 transition-all"
              style={{ width: `${(completedCount / totalCategories) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500">
            {Math.round((completedCount / totalCategories) * 100)}%
          </span>
        </div>
      </div>

      {allCompleted ? (
        <Phase05FinalGate projectId={projectId} />
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Completa cada categoria de testing y QA. Marca como completada cuando hayas verificado todos los items.
          </p>

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
