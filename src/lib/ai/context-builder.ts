import { createClient } from '@/lib/supabase/server'
import type { Phase00Section, Phase02Section } from '@/types/conversation'
import { SECTION_LABELS } from '@/lib/ai/prompts/phase-00'
import { SECTION_LABELS as PHASE02_SECTION_LABELS } from '@/lib/ai/prompts/phase-02'

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

  const raw = Object.values(byFeature)
    .map((f) => `### Feature: ${f.name}\n${f.docs.join('\n')}`)
    .join('\n\n')

  // Cap total size for context (~50K tokens ≈ 200k chars); keep recent features fuller
  const maxFeatureSpecsChars = 120_000
  return truncateText(raw, maxFeatureSpecsChars)
}

export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n...[truncado]'
}

/** ~50K tokens ≈ 200k chars. When total exceeds maxTotal, truncate progressively. */
export function applyProgressiveTruncation(
  discoveryDocs: string,
  featureSpecs: string,
  artifacts: string,
  maxTotal: number = 200_000,
): { discoveryDocs: string; featureSpecs: string; artifacts: string } {
  const totalChars = discoveryDocs.length + featureSpecs.length + artifacts.length
  if (totalChars <= maxTotal) {
    return { discoveryDocs, featureSpecs, artifacts }
  }
  return {
    discoveryDocs: truncateText(discoveryDocs, 40_000),
    featureSpecs: truncateText(featureSpecs, 80_000),
    artifacts: truncateText(artifacts, 20_000),
  }
}

export type Phase02Context = {
  name: string
  description: string | null
  industry: string | null
  persona: string | null
  approvedSections: string[]
  discoveryDocs: string
  featureSpecs: string
}

export async function buildPhase02Context(projectId: string): Promise<Phase02Context> {
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

  // Get approved Phase 02 sections for coherence
  const { data: sections } = await supabase
    .from('phase_sections')
    .select('section, status')
    .eq('project_id', projectId)
    .eq('phase_number', 2)
    .eq('status', 'approved')

  const approvedSections = (sections ?? []).map(
    (s) => PHASE02_SECTION_LABELS[s.section as Phase02Section] ?? s.section
  )

  // Get discovery docs and feature specs for context
  const discoveryDocs = await getApprovedDiscoveryDocs(projectId)
  const featureSpecs = await getApprovedFeatureSpecs(projectId)

  return {
    name: project.name,
    description: project.description,
    industry: project.industry,
    persona: profile?.persona ?? null,
    approvedSections,
    discoveryDocs: truncateText(discoveryDocs, 8000),
    featureSpecs: truncateText(featureSpecs, 12000),
  }
}

export async function buildFullProjectContext(projectId: string): Promise<{
  name: string
  description: string | null
  industry: string | null
  persona: string | null
  currentPhase: number
  phaseName: string
  discoveryDocs: string
  featureSpecs: string
  artifacts: string
}> {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('name, description, industry, current_phase, user_id')
    .eq('id', projectId)
    .single()

  if (!project) throw new Error('Project not found')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('persona')
    .eq('id', project.user_id)
    .single()

  const PHASE_NAMES: Record<number, string> = {
    0: 'Discovery & Ideation',
    1: 'Requirements & Spec',
    2: 'Architecture & Design',
    3: 'Environment Setup',
    4: 'Core Development',
    5: 'Testing & QA',
    6: 'Launch & Deployment',
    7: 'Iteration & Growth',
  }

  const discoveryDocs = await getApprovedDiscoveryDocs(projectId)
  const featureSpecs = await getApprovedFeatureSpecs(projectId)

  // Fetch artifacts
  const { data: artifactDocs } = await supabase
    .from('project_documents')
    .select('section, content')
    .eq('project_id', projectId)
    .eq('document_type', 'artifact')

  const artifacts = (artifactDocs ?? [])
    .map((a) => `### ${a.section}\n${truncateText(a.content ?? '', 1000)}`)
    .join('\n\n')

  const { discoveryDocs: finalDiscovery, featureSpecs: finalSpecs, artifacts: finalArtifacts } =
    applyProgressiveTruncation(discoveryDocs, featureSpecs, artifacts, 200_000)

  return {
    name: project.name,
    description: project.description,
    industry: project.industry,
    persona: profile?.persona ?? null,
    currentPhase: project.current_phase,
    phaseName: PHASE_NAMES[project.current_phase] ?? '',
    discoveryDocs: finalDiscovery,
    featureSpecs: finalSpecs,
    artifacts: finalArtifacts,
  }
}
