export type DesignType = 'wireframe' | 'mockup_lowfi' | 'mockup_highfi'

export type DesignStatus = 'generating' | 'draft' | 'approved'

export type DesignSource = 'internal' | 'figma' | 'v0' | 'lovable'

export type DesignArtifact = {
  id: string
  project_id: string
  type: DesignType
  screen_name: string
  flow_name: string | null
  storage_path: string
  mime_type: string
  status: DesignStatus
  prompt_used: string | null
  source: DesignSource
  external_url: string | null
  external_id: string | null
  created_at: string
  updated_at: string
}
