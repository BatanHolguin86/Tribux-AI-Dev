import { createClient } from '@/lib/supabase/server'
import { Phase02Layout } from '@/components/phase-02/Phase02Layout'
import { PlanGuard } from '@/components/shared/PlanGuard'
import { canAccessPhase } from '@/lib/plans/guards'
import { getDesignWorkflowContext } from '@/lib/ai/context-builder'
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

type ApprovedDesign = {
  id: string
  screen_name: string
  type: string
  status: string
  created_at: string
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
        .select('plan, subscription_status, trial_ends_at, persona')
        .eq('id', user.id)
        .single()
    : { data: null }

  const isFounder = profile?.persona === 'founder' || profile?.persona === 'emprendedor' || profile?.persona === 'ceo'

  const hasAccess = profile ? canAccessPhase(2, profile) : false

  if (!hasAccess) {
    return (
      <PlanGuard hasAccess={false} currentPlan={profile?.plan ?? 'starter'} feature="Phase 02 — Arquitectura">
        <div />
      </PlanGuard>
    )
  }

  // Fetch project integration tokens for connected tools
  const { data: projectTokens } = await supabase
    .from('projects')
    .select('figma_token, v0_api_key')
    .eq('id', projectId)
    .eq('user_id', user!.id)
    .single()

  const connectedTools = {
    figma: !!projectTokens?.figma_token,
    v0: !!projectTokens?.v0_api_key,
  }

  // Fetch sections, conversations, documents, approved designs, all artifacts, and workflow context
  const [sectionsRes, conversationsRes, documentsRes, designsRes, allArtifactsRes, workflowContext] = await Promise.all([
    supabase
      .from('phase_sections')
      .select('*')
      .eq('project_id', projectId)
      .eq('phase_number', 2),
    supabase
      .from('agent_conversations')
      .select('section, messages')
      .eq('project_id', projectId)
      .eq('phase_number', 2)
      .eq('agent_type', 'orchestrator'),
    supabase
      .from('project_documents')
      .select('id, section, content, version, status')
      .eq('project_id', projectId)
      .eq('phase_number', 2),
    supabase
      .from('design_artifacts')
      .select('id, screen_name, type, status, created_at')
      .eq('project_id', projectId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    supabase
      .from('design_artifacts')
      .select('id, screen_name, type, status, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
    getDesignWorkflowContext(projectId),
  ])

  // Fetch features with their document completion status
  const { data: featuresData } = await supabase
    .from('project_features')
    .select('id, name, status')
    .eq('project_id', projectId)
    .order('created_at')

  const { data: featureDocsData } = await supabase
    .from('feature_documents')
    .select('feature_id, doc_type, status')
    .eq('project_id', projectId)

  const allFeatures = (featuresData ?? []).map((f) => {
    const docs = (featureDocsData ?? []).filter((d) => d.feature_id === f.id)
    const hasRequirements = docs.some((d) => d.doc_type === 'requirements' && (d.status === 'approved' || d.status === 'draft'))
    const hasDesign = docs.some((d) => d.doc_type === 'design' && (d.status === 'approved' || d.status === 'draft'))
    const hasTasks = docs.some((d) => d.doc_type === 'tasks' && (d.status === 'approved' || d.status === 'draft'))
    const isComplete = hasRequirements && hasDesign && hasTasks

    return {
      id: f.id as string,
      name: f.name as string,
      isComplete,
      hasRequirements,
      hasDesign,
      hasTasks,
    }
  })

  const completedFeatures = allFeatures

  const sections = sectionsRes.data ?? []
  const conversations = conversationsRes.data ?? []
  const documents = documentsRes.data ?? []
  const approvedDesigns: ApprovedDesign[] = (designsRes.data as ApprovedDesign[]) ?? []

  const allArtifacts = (allArtifactsRes.data ?? []).map((a) => ({
    id: a.id as string,
    title: a.screen_name as string,
    document_type: a.type as string,
    status: a.status as string,
    created_at: a.created_at as string,
  }))

  // Build a map of approved documents for status override
  const approvedDocs = new Set(
    documents.filter((d) => d.status === 'approved').map((d) => d.section),
  )

  // Best-effort DB sync: update phase_sections for approved documents
  for (const sectionKey of approvedDocs) {
    const row = sections.find((s) => s.section === sectionKey)
    if (row && row.status !== 'approved') {
      supabase
        .from('phase_sections')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('phase_number', 2)
        .eq('section', sectionKey)
        .then(() => {})
    }
  }

  const sectionData: SectionData[] = PHASE02_SECTIONS.map((key) => {
    const sectionRow = sections.find((s) => s.section === key)
    const conv = conversations.find((c) => c.section === key)
    const doc = documents.find((d) => d.section === key)

    // If document is approved, override section status to 'approved'
    const rawStatus = (sectionRow?.status ?? 'pending') as SectionStatus
    let effectiveStatus = approvedDocs.has(key) ? 'approved' as SectionStatus : rawStatus

    // Founder Mode: auto-approve technical architecture sections
    // Founders don't need to review system architecture, database design, etc.
    if (isFounder && effectiveStatus !== 'approved') {
      effectiveStatus = 'approved' as SectionStatus
      // Best-effort DB sync
      supabase
        .from('phase_sections')
        .upsert(
          { project_id: projectId, phase_number: 2, section: key, status: 'approved', approved_at: new Date().toISOString() },
          { onConflict: 'project_id,phase_number,section' },
        )
        .then(() => {})
    }

    return {
      key,
      label: SECTION_LABELS[key],
      status: effectiveStatus,
      messages: (conv?.messages as Array<{ role: string; content: string; created_at: string }>) ?? [],
      document: doc
        ? { id: doc.id, content: doc.content, version: doc.version, status: doc.status }
        : null,
    }
  })

  // Find the first section that still needs work
  const activeSection = sectionData.find((s) => s.status !== 'approved')?.key ?? 'system_architecture'

  return (
    <Phase02Layout
      projectId={projectId}
      sections={sectionData}
      initialActiveSection={activeSection}
      approvedDesigns={approvedDesigns}
      designArtifacts={allArtifacts}
      workflowContext={workflowContext}
      connectedTools={connectedTools}
      completedFeatures={completedFeatures}
    />
  )
}
