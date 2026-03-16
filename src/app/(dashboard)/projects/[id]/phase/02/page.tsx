import { createClient } from '@/lib/supabase/server'
import { Phase02Layout } from '@/components/phase-02/Phase02Layout'
import { PlanGuard } from '@/components/shared/PlanGuard'
import { canAccessPhase } from '@/lib/plans/guards'
import { PHASE02_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-02'
import type { Phase02Section, SectionStatus } from '@/types/conversation'

type SectionData = {
  key: Phase02Section
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

export default async function Phase02Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // Plan guard check
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase
        .from('user_profiles')
        .select('plan, subscription_status, trial_ends_at')
        .eq('id', user.id)
        .single()
    : { data: null }

  const hasAccess = profile ? canAccessPhase(2, profile) : false

  if (!hasAccess) {
    return (
      <PlanGuard hasAccess={false} currentPlan={profile?.plan ?? 'starter'} feature="Phase 02 — Arquitectura">
        <div />
      </PlanGuard>
    )
  }

  // Fetch sections, conversations, and documents
  const [sectionsRes, conversationsRes, documentsRes] = await Promise.all([
    supabase
      .from('phase_sections')
      .select('*')
      .eq('project_id', projectId)
      .eq('phase_number', 2),
    supabase
      .from('agent_conversations')
      .select('section, messages')
      .eq('project_id', projectId)
      .eq('phase_number', 2),
    supabase
      .from('project_documents')
      .select('id, section, content, version, status')
      .eq('project_id', projectId)
      .eq('phase_number', 2),
  ])

  const sections = sectionsRes.data ?? []
  const conversations = conversationsRes.data ?? []
  const documents = documentsRes.data ?? []

  const sectionData: SectionData[] = PHASE02_SECTIONS.map((key) => {
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
  const activeSection = sectionData.find((s) => s.status !== 'approved')?.key ?? 'system_architecture'

  return (
    <Phase02Layout
      projectId={projectId}
      sections={sectionData}
      initialActiveSection={activeSection}
    />
  )
}
