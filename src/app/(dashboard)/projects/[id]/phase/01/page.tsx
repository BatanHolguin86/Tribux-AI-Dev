import { createClient } from '@/lib/supabase/server'
import { Phase01Layout } from '@/components/phase-01/Phase01Layout'
import type { KiroDocumentType } from '@/types/feature'

type FeatureData = {
  id: string
  name: string
  description: string | null
  display_order: number
  status: string
  documents: Record<KiroDocumentType, {
    id: string
    content: string | null
    version: number
    status: string
  } | null>
  conversations: Record<KiroDocumentType, Array<{ role: string; content: string }>>
}

export default async function Phase01Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // Fetch features with documents
  const { data: features } = await supabase
    .from('project_features')
    .select('*, feature_documents(*)')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true })

  // Fetch conversations for Phase 01
  const { data: conversations } = await supabase
    .from('agent_conversations')
    .select('section, messages')
    .eq('project_id', projectId)
    .eq('phase_number', 1)

  // Fetch discovery docs for summary
  const { data: discoveryDocs } = await supabase
    .from('project_documents')
    .select('section, content, status')
    .eq('project_id', projectId)
    .eq('phase_number', 0)
    .eq('status', 'approved')

  const docTypes: KiroDocumentType[] = ['requirements', 'design', 'tasks']

  const featureData: FeatureData[] = (features ?? []).map((f) => {
    const docs: Record<string, { id: string; content: string | null; version: number; status: string } | null> = {}
    const convs: Record<string, Array<{ role: string; content: string }>> = {}

    for (const dt of docTypes) {
      const doc = (f.feature_documents ?? []).find((d: { document_type: string }) => d.document_type === dt)
      docs[dt] = doc ? { id: doc.id, content: doc.content, version: doc.version, status: doc.status } : null

      const section = `feature_${f.id}_${dt}`
      const conv = (conversations ?? []).find((c) => c.section === section)
      convs[dt] = (conv?.messages as Array<{ role: string; content: string }>) ?? []
    }

    return {
      id: f.id,
      name: f.name,
      description: f.description,
      display_order: f.display_order,
      status: f.status,
      documents: docs as FeatureData['documents'],
      conversations: convs as FeatureData['conversations'],
    }
  })

  const discoverySummary = (discoveryDocs ?? []).map((d) => ({
    section: d.section ?? '',
    content: d.content ?? '',
  }))

  return (
    <Phase01Layout
      projectId={projectId}
      features={featureData}
      discoverySummary={discoverySummary}
    />
  )
}
