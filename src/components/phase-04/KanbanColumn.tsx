'use client'

import { useDroppable } from '@dnd-kit/core'
import type { TaskWithFeature, TaskStatus } from '@/types/task'
import { TaskCard } from './TaskCard'

type KanbanColumnProps = {
  status: TaskStatus
  label: string
  count: number
  colorClass: string
  tasks: TaskWithFeature[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}

export function KanbanColumn({
  status,
  label,
  count,
  colorClass,
  tasks,
  onStatusChange,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border border-gray-200 border-t-4 bg-gray-50 ${colorClass} ${
        isOver ? 'ring-2 ring-violet-300' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-600">
          {count}
        </span>
      </div>

      {/* Tasks */}
      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2" style={{ maxHeight: 'calc(100vh - 20rem)' }}>
        {tasks.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
            Arrastra tasks aqui
          </div>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  )
}
