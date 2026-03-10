'use client'

import { useState, useCallback } from 'react'
import type { SectionStatus } from '@/types/conversation'
import { PHASE03_SECTIONS } from '@/lib/ai/prompts/phase-03'
import { ChecklistCategory } from './ChecklistCategory'
import { Phase03FinalGate } from './Phase03FinalGate'

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
      {/* Progress bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Environment Setup</h2>
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
        <Phase03FinalGate projectId={projectId} />
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Completa cada categoria marcandola cuando hayas configurado todos los items.
            Usa el boton de agente para pedir ayuda al DevOps Engineer.
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
