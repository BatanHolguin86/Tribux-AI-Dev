import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Get existing KB source_ids to avoid duplicates
  const { data: existing } = await supabase
    .from('knowledge_base_entries')
    .select('source_id')
    .eq('project_id', projectId)
    .not('source_type', 'is', null)

  const existingIds = new Set((existing ?? []).map((e) => e.source_id))

  // Fetch all approved project_documents
  const { data: projectDocs } = await supabase
    .from('project_documents')
    .select('id, section, content, phase_number')
    .eq('project_id', projectId)
    .eq('status', 'approved')

  // Fetch all approved feature_documents with feature name
  const { data: featureDocs } = await supabase
    .from('feature_documents')
    .select('id, document_type, content, feature_id')
    .eq('project_id', projectId)
    .eq('status', 'approved')

  const featureIds = [...new Set((featureDocs ?? []).map((d) => d.feature_id))]
  const featureNames: Record<string, string> = {}
  if (featureIds.length > 0) {
    const { data: features } = await supabase
      .from('project_features')
      .select('id, name')
      .in('id', featureIds)
    for (const f of features ?? []) {
      featureNames[f.id] = f.name
    }
  }

  const entries: Array<Record<string, unknown>> = []

  for (const doc of projectDocs ?? []) {
    if (existingIds.has(doc.id)) continue
    const guiaSections = ['system_architecture', 'database_design', 'api_design']
    entries.push({
      project_id: projectId,
      category: doc.section === 'architecture_decisions' ? 'decisiones'
        : guiaSections.includes(doc.section) ? 'guias'
        : 'documentos',
      title: doc.section,
      summary: (doc.content ?? '').slice(0, 200),
      content: doc.content,
      source_type: 'project_document',
      source_id: doc.id,
      phase_number: doc.phase_number,
    })
  }

  for (const doc of featureDocs ?? []) {
    if (existingIds.has(doc.id)) continue
    entries.push({
      project_id: projectId,
      category: doc.document_type === 'design' ? 'guias' : 'documentos',
      title: `${doc.document_type} — ${featureNames[doc.feature_id] ?? 'Feature'}`,
      summary: (doc.content ?? '').slice(0, 200),
      content: doc.content,
      source_type: 'feature_document',
      source_id: doc.id,
      phase_number: 1,
    })
  }

  if (entries.length === 0) {
    return Response.json({ created: 0 })
  }

  const { error } = await supabase
    .from('knowledge_base_entries')
    .insert(entries)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ created: entries.length })
}
