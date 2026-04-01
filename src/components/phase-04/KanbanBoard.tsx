'use client'

import { useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { TaskWithFeature, TaskStatus } from '@/types/task'
import { TASK_STATUS_LABELS } from '@/types/task'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

const COLUMN_COLORS: Record<TaskStatus, string> = {
  todo: 'border-t-gray-400',
  in_progress: 'border-t-blue-500',
  review: 'border-t-amber-500',
  done: 'border-t-green-500',
}

type KanbanBoardProps = {
  tasks: TaskWithFeature[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onGenerateCode?: (task: TaskWithFeature) => void
  onAutoBuild?: (task: TaskWithFeature) => void
}

export function KanbanBoard({ tasks, onStatusChange, onGenerateCode, onAutoBuild }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithFeature | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id)
      if (task) setActiveTask(task)
    },
    [tasks]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null)
      const { active, over } = event

      if (!over) return

      const taskId = active.id as string
      const overId = over.id as string

      // Check if dropped on a column
      if (COLUMNS.includes(overId as TaskStatus)) {
        const task = tasks.find((t) => t.id === taskId)
        if (task && task.status !== overId) {
          onStatusChange(taskId, overId as TaskStatus)
        }
        return
      }

      // Dropped on another task — use that task's column
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) {
        const task = tasks.find((t) => t.id === taskId)
        if (task && task.status !== overTask.status) {
          onStatusChange(taskId, overTask.status)
        }
      }
    },
    [tasks, onStatusChange]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status)
          return (
            <KanbanColumn
              key={status}
              status={status}
              label={TASK_STATUS_LABELS[status]}
              count={columnTasks.length}
              colorClass={COLUMN_COLORS[status]}
              tasks={columnTasks}
              onStatusChange={onStatusChange}
              onGenerateCode={onGenerateCode}
              onAutoBuild={onAutoBuild}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
