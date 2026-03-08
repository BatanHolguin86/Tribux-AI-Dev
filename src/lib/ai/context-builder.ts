import { createClient } from '@/lib/supabase/server'
import type { Phase00Section } from '@/types/conversation'
import { SECTION_LABELS } from '@/lib/ai/prompts/phase-00'

export type ProjectContext = {
  name: string
  description: string | null
  industry: string | null
  persona: string | null
  approvedSections: string[]
}

export async function buildProjectContext(projectId: string): Promise<ProjectContext> {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('name, description, industry, user_id')
    .eq('id', projectId)
    .single()

  if (!project) throw new Error('Project not found')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('persona')
    .eq('id', project.user_id)
    .single()

  const { data: sections } = await supabase
    .from('phase_sections')
    .select('section, status')
    .eq('project_id', projectId)
    .eq('phase_number', 0)
    .eq('status', 'approved')

  const approvedSections = (sections ?? []).map(
    (s) => SECTION_LABELS[s.section as Phase00Section] ?? s.section
  )

  return {
    name: project.name,
    description: project.description,
    industry: project.industry,
    persona: profile?.persona ?? null,
    approvedSections,
  }
}

export async function getApprovedDiscoveryDocs(projectId: string): Promise<string> {
  const supabase = await createClient()

  const { data: docs } = await supabase
    .from('project_documents')
    .select('section, content')
    .eq('project_id', projectId)
    .eq('phase_number', 0)
    .eq('status', 'approved')

  if (!docs || docs.length === 0) return ''

  return docs
    .map((d) => `### ${d.section}\n${truncateText(d.content ?? '', 2000)}`)
    .join('\n\n')
}

export async function getApprovedFeatureSpecs(
  projectId: string,
  excludeFeatureId?: string,
): Promise<string> {
  const supabase = await createClient()

  let query = supabase
    .from('feature_documents')
    .select('feature_id, document_type, content, project_features(name)')
    .eq('project_id', projectId)
    .eq('status', 'approved')

  if (excludeFeatureId) {
    query = query.neq('feature_id', excludeFeatureId)
  }

  const { data: docs } = await query

  if (!docs || docs.length === 0) return ''

  // Group by feature
  const byFeature: Record<string, { name: string; docs: string[] }> = {}
  for (const d of docs) {
    const featureName = (d.project_features as unknown as { name: string })?.name ?? d.feature_id
    if (!byFeature[d.feature_id]) {
      byFeature[d.feature_id] = { name: featureName, docs: [] }
    }
    byFeature[d.feature_id].docs.push(
      `#### ${d.document_type}\n${truncateText(d.content ?? '', 1500)}`
    )
  }

  return Object.values(byFeature)
    .map((f) => `### Feature: ${f.name}\n${f.docs.join('\n')}`)
    .join('\n\n')
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n...[truncado]'
}
