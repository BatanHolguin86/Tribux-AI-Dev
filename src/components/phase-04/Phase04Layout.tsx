'use client'

import { useState, useCallback } from 'react'
import type { TaskWithFeature, TaskStatus } from '@/types/task'
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
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Core Development</h2>
          <p className="text-sm text-gray-600">
            {doneTasks} de {totalTasks} tasks completadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-violet-600 transition-all"
              style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500">
            {Math.round((doneTasks / totalTasks) * 100)}%
          </span>
        </div>
      </div>

      {allDone ? (
        <Phase04FinalGate projectId={projectId} totalTasks={totalTasks} />
      ) : (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
