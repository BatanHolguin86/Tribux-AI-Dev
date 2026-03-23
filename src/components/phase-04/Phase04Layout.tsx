'use client'

import { useState, useCallback } from 'react'
import type { TaskWithFeature, TaskStatus } from '@/types/task'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { KanbanBoard } from './KanbanBoard'
import { Phase04FinalGate } from './Phase04FinalGate'

type Phase04LayoutProps = {
  projectId: string
  initialTasks: TaskWithFeature[]
}

const phaseAgents = getPhaseAgents(4)

export function Phase04Layout({ projectId, initialTasks }: Phase04LayoutProps) {
  const [tasks, setTasks] = useState(initialTasks)

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const allDone = totalTasks > 0 && doneTasks === totalTasks

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )

      const res = await fetch(`/api/projects/${projectId}/phases/4/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
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

  const sectionsContent = totalTasks === 0 ? (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 py-16">
      <div className="mb-3 text-4xl">📋</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No hay tasks aun</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
        Las tasks se generan automaticamente desde los specs KIRO de Phase 01
        cuando Phase 03 es aprobada.
      </p>
    </div>
  ) : (
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
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Mueve las tasks por el Kanban. Usa el tab <span className="font-medium text-gray-700 dark:text-gray-300">Equipo</span> para consultar al Lead Developer o CTO.
          </p>
          <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
        </>
      )}
    </div>
  )

  const teamContent = (
    <PhaseTeamPanel
      projectId={projectId}
      phaseNumber={4}
      agentTypes={phaseAgents}
    />
  )

  return (
    <PhaseWorkspaceTabs
      phaseNumber={4}
      projectId={projectId}
      phaseAgents={phaseAgents}
      teamContent={teamContent}
    >
      {sectionsContent}
    </PhaseWorkspaceTabs>
  )
}
