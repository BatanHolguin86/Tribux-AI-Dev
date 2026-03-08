import { createClient } from '@/lib/supabase/server'
import { Phase00Layout } from '@/components/phase-00/Phase00Layout'
import { PHASE00_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-00'
import type { Phase00Section, SectionStatus } from '@/types/conversation'

type SectionData = {
  key: Phase00Section
  label: string
  status: SectionStatus
  messages: Array<{ role: string; content: string; created_at: string }>
  document: {
    id: string
    content: string | null
    version: number
    status: string
  } | null
}

export default async function Phase00Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // Fetch sections, conversations, and documents
  const [sectionsRes, conversationsRes, documentsRes] = await Promise.all([
    supabase
      .from('phase_sections')
      .select('*')
      .eq('project_id', projectId)
      .eq('phase_number', 0),
    supabase
      .from('agent_conversations')
      .select('section, messages')
      .eq('project_id', projectId)
      .eq('phase_number', 0),
    supabase
      .from('project_documents')
      .select('id, section, content, version, status')
      .eq('project_id', projectId)
      .eq('phase_number', 0),
  ])

  const sections = sectionsRes.data ?? []
  const conversations = conversationsRes.data ?? []
  const documents = documentsRes.data ?? []

  const sectionData: SectionData[] = PHASE00_SECTIONS.map((key) => {
    const sectionRow = sections.find((s) => s.section === key)
    const conv = conversations.find((c) => c.section === key)
    const doc = documents.find((d) => d.section === key)

    return {
      key,
      label: SECTION_LABELS[key],
      status: (sectionRow?.status ?? 'pending') as SectionStatus,
      messages: (conv?.messages as Array<{ role: string; content: string; created_at: string }>) ?? [],
      document: doc
        ? { id: doc.id, content: doc.content, version: doc.version, status: doc.status }
        : null,
    }
  })

  // Find the first non-approved section as default active
  const activeSection = sectionData.find((s) => s.status !== 'approved')?.key ?? 'problem_statement'

  return (
    <Phase00Layout
      projectId={projectId}
      sections={sectionData}
      initialActiveSection={activeSection}
    />
  )
}
