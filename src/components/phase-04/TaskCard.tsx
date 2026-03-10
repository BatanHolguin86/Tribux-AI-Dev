'use client'

import { useDraggable } from '@dnd-kit/core'
import type { TaskWithFeature, TaskStatus } from '@/types/task'
import { TASK_STATUS_LABELS } from '@/types/task'

type TaskCardProps = {
  task: TaskWithFeature
  isDragging?: boolean
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: 'in_progress',
  in_progress: 'review',
  review: 'done',
  done: null,
}

export function TaskCard({ task, isDragging, onStatusChange }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  const nextStatus = NEXT_STATUS[task.status]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'rotate-2 opacity-90 shadow-lg' : 'border-gray-200'
      }`}
    >
      {/* Task key */}
      <div className="mb-1 flex items-center justify-between">
        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
          {task.task_key}
        </span>
        {task.category && (
          <span className="text-[10px] text-gray-400">{task.category}</span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-800 leading-snug">{task.title}</p>

      {/* Feature name */}
      {task.feature_name && (
        <p className="mt-1.5 text-[10px] text-gray-400 truncate">
          {task.feature_name}
        </p>
      )}

      {/* Quick advance button */}
      {nextStatus && onStatusChange && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStatusChange(task.id, nextStatus)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 w-full rounded border border-gray-200 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:border-violet-300 hover:text-violet-600"
        >
          Mover a {TASK_STATUS_LABELS[nextStatus]}
        </button>
      )}
    </div>
  )
}
