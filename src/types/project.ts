export type ProjectStatus = 'active' | 'paused' | 'archived' | 'completed'

export type PhaseStatus = 'locked' | 'active' | 'completed'

export type Project = {
  id: string
  user_id: string
  name: string
  description: string | null
  industry: string | null
  repo_url: string | null
  supabase_project_ref: string | null
  supabase_access_token: string | null
  current_phase: number
  status: ProjectStatus
  last_activity: string
  created_at: string
  updated_at: string
}

export type ProjectPhase = {
  id: string
  project_id: string
  phase_number: number
  status: PhaseStatus
  started_at: string | null
  completed_at: string | null
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

export type ProjectWithProgress = Project & {
  active_phase: number
  phases_completed: number
  progress_percentage: number
  next_action: string
  phases?: ProjectPhase[]
  has_supabase_token?: boolean
}

export type DashboardSummary = {
  total_active: number
  phases_completed_this_week: number
}

export const PHASE_NAMES: Record<number, string> = {
  0: 'Discovery & Ideation',
  1: 'Requirements & Spec',
  2: 'Architecture & Design',
  3: 'Environment Setup',
  4: 'Core Development',
  5: 'Testing & QA',
  6: 'Launch & Deployment',
  7: 'Iteration & Growth',
}
