import { createClient } from '@/lib/supabase/server'
import { DesignGenerator } from '@/components/design/DesignGenerator'

export default async function DesignsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // Load existing design artifacts
  const { data: artifacts } = await supabase
    .from('project_documents')
    .select('id, title, document_type, status, created_at')
    .eq('project_id', projectId)
    .eq('document_type', 'artifact')
    .order('created_at', { ascending: false })

  return (
    <DesignGenerator
      projectId={projectId}
      existingArtifacts={artifacts ?? []}
    />
  )
}
