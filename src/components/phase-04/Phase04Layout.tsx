'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { TaskWithFeature, TaskStatus } from '@/types/task'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { KanbanBoard } from './KanbanBoard'
import { Phase04FinalGate } from './Phase04FinalGate'

type Phase04LayoutProps = {
  projectId: string
  initialTasks: TaskWithFeature[]
}

export function Phase04Layout({ projectId, initialTasks }: Phase04LayoutProps) {
  const [tasks, setTasks] = useState(initialTasks)

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const allDone = totalTasks > 0 && doneTasks === totalTasks

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )

      const res = await fetch(`/api/projects/${projectId}/phases/4/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        // Revert on error
        setTasks((prev) =>
          prev.map((t) => {
            const original = initialTasks.find((o) => o.id === taskId)
            return t.id === taskId && original ? { ...t, status: original.status } : t
          })
        )
      }
    },
    [projectId, initialTasks]
  )

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-16">
        <div className="mb-3 text-4xl">📋</div>
        <h3 className="text-lg font-semibold text-gray-900">No hay tasks aun</h3>
        <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
          Las tasks se generan automaticamente desde los specs KIRO de Phase 01
          cuando Phase 03 es aprobada.
        </p>
      </div>
    )
  }

  return (
    <div>
      <PhaseProgressHeader
        title="Core Development"
        completedCount={doneTasks}
        totalCount={totalTasks}
        unitLabel="tasks"
      />

      {allDone ? (
        <Phase04FinalGate projectId={projectId} totalTasks={totalTasks} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <span>
              ¿Quieres una estrategia para ejecutar tus tasks sin perderte? Habla con el <span className="font-medium">CTO Virtual</span> y pide el plan de Phase 04.
            </span>
            <Link
              href={`/projects/${projectId}/agents`}
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700"
            >
              Abrir chat del CTO
            </Link>
          </div>
          <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
        </>
      )}
    </div>
  )
}
