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
