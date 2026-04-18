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
        <span className="rounded bg-brand-surface px-1.5 py-0.5 text-[10px] font-bold text-brand-primary dark:bg-brand-primary/40 dark:text-brand-teal">
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
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-brand-teal/30 bg-brand-surface py-1 text-[10px] font-medium text-brand-primary transition-colors hover:border-brand-teal hover:bg-brand-surface dark:border-brand-primary dark:bg-brand-primary/20 dark:text-brand-teal dark:hover:border-brand-teal dark:hover:bg-brand-primary/40"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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
          className="mt-2 w-full rounded border border-gray-200 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:border-brand-teal hover:text-brand-primary dark:border-gray-600 dark:text-gray-400 dark:hover:border-[#0A1F33] dark:hover:text-brand-teal"
        >
          Mover a {TASK_STATUS_LABELS[nextStatus]}
        </button>
      )}
    </div>
  )
}
