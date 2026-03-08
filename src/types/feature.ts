export type FeatureStatus = 'pending' | 'in_progress' | 'spec_complete' | 'approved'

export type KiroDocumentType = 'requirements' | 'design' | 'tasks'

export type ProjectFeature = {
  id: string
  project_id: string
  name: string
  description: string | null
  display_order: number
  status: FeatureStatus
  suggested_by: 'orchestrator' | 'user'
  created_at: string
  updated_at: string
}

export type FeatureDocument = {
  id: string
  feature_id: string
  project_id: string
  document_type: KiroDocumentType
  storage_path: string
  content: string | null
  version: number
  status: 'draft' | 'approved'
  approved_at: string | null
  created_at: string
  updated_at: string
}
