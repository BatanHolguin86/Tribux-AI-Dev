export type PrerequisiteCheck =
  | { type: 'field-exists'; field: 'repo_url' | 'supabase_project_ref' | 'supabase_access_token' }
  | { type: 'env-exists'; env: string }
  | { type: 'phase-completed'; phase: number }

export type ActionType =
  | 'ai-generate-commit'
  | 'ai-generate-sql'
  | 'sql-execute'
  | 'github-api'
  | 'ai-report'
  | 'external-api'

export type ActionDefinition = {
  actionName: string
  phaseNumber: number
  section: string
  itemIndices: number[]
  label: string
  description: string
  prerequisites: PrerequisiteCheck[]
  type: ActionType
  streaming: boolean
  confirmRequired?: boolean
}

export type ActionExecutionStatus = 'pending' | 'running' | 'success' | 'failed'

export type ActionExecution = {
  id: string
  project_id: string
  phase_number: number
  section: string
  item_index: number
  action_name: string
  status: ActionExecutionStatus
  result_summary: string | null
  result_data: Record<string, unknown> | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}
