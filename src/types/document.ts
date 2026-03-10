export type DocumentType =
  | 'brief'
  | 'personas'
  | 'value_proposition'
  | 'metrics'
  | 'competitive_analysis'
  | 'requirements'
  | 'design'
  | 'tasks'
  | 'artifact'
  | 'system_architecture'
  | 'database_design'
  | 'api_design'
  | 'architecture_decisions'

export type DocumentStatus = 'draft' | 'approved'

export type ProjectDocument = {
  id: string
  project_id: string
  phase_number: number | null
  section: string | null
  document_type: DocumentType
  storage_path: string
  content: string | null
  version: number
  status: DocumentStatus
  approved_at: string | null
  created_at: string
  updated_at: string
}
