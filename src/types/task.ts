export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export type ProjectTask = {
  id: string
  project_id: string
  feature_id: string | null
  task_key: string
  title: string
  category: string | null
  status: TaskStatus
  display_order: number
  created_at: string
  updated_at: string
}

export type TaskWithFeature = ProjectTask & {
  feature_name: string | null
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Por hacer',
  in_progress: 'En progreso',
  review: 'En revision',
  done: 'Completado',
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
}
