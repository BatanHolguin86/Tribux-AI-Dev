'use client'

import { useDraggable } from '@dnd-kit/core'
import type { TaskWithFeature, TaskStatus } from '@/types/task'
import { TASK_STATUS_LABELS } from '@/types/task'

type TaskCardProps = {
  task: TaskWithFeature
  isDragging?: boolean
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
  onGenerateCode?: (task: TaskWithFeature) => void
  onAutoBuild?: (task: TaskWithFeature) => void
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: 'in_progress',
  in_progress: 'review',
  review: 'done',
  done: null,
}

export function TaskCard({ task, isDragging, onStatusChange, onGenerateCode, onAutoBuild }: TaskCardProps) {
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
      className={`cursor-grab rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800 dark:hover:shadow-lg ${
        isDragging ? 'rotate-2 opacity-90 shadow-lg' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Task key */}
      <div className="mb-1 flex items-center justify-between">
        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
          {task.task_key}
        </span>
        {task.category && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{task.category}</span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-800 leading-snug dark:text-gray-200">{task.title}</p>

      {/* Feature name */}
      {task.feature_name && (
        <p className="mt-1.5 text-[10px] text-gray-400 truncate">
          {task.feature_name}
        </p>
      )}

      {/* Generate code button */}
      {onGenerateCode && (task.status === 'todo' || task.status === 'in_progress') && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onGenerateCode(task)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-violet-200 bg-violet-50 py-1 text-[10px] font-medium text-violet-600 transition-colors hover:border-violet-400 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:border-violet-600 dark:hover:bg-violet-900/40"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generar codigo
        </button>
      )}

      {/* Auto Build button */}
      {onAutoBuild && (task.status === 'todo' || task.status === 'in_progress') && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAutoBuild(task)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 py-1 text-[10px] font-medium text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/40"
        >
          🤖 Auto Build
        </button>
      )}

      {/* Quick advance button */}
      {nextStatus && onStatusChange && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStatusChange(task.id, nextStatus)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 w-full rounded border border-gray-200 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-violet-700 dark:hover:text-violet-400"
        >
          Mover a {TASK_STATUS_LABELS[nextStatus]}
        </button>
      )}
    </div>
  )
}
