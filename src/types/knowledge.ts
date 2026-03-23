export const KB_CATEGORIES = ['documentos', 'decisiones', 'guias', 'artefactos', 'notas'] as const
export type KBCategory = (typeof KB_CATEGORIES)[number]
export type KBSourceType = 'project_document' | 'feature_document' | 'design_artifact'

export const KB_CATEGORY_LABELS: Record<KBCategory, string> = {
  documentos: 'Documentos',
  decisiones: 'Decisiones',
  guias: 'Guias',
  artefactos: 'Artefactos',
  notas: 'Notas',
}

export const KB_CATEGORY_ICONS: Record<KBCategory, string> = {
  documentos: '📄',
  decisiones: '⚖️',
  guias: '📐',
  artefactos: '🎨',
  notas: '📝',
}

export type KnowledgeBaseEntry = {
  id: string
  project_id: string
  category: KBCategory
  title: string
  summary: string | null
  content: string | null
  source_type: KBSourceType | null
  source_id: string | null
  phase_number: number | null
  tags: string[]
  is_pinned: boolean
  created_at: string
  updated_at: string
}
