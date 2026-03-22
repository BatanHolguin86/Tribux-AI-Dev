import { createClient } from '@/lib/supabase/server'
import { getDesignWorkflowContext } from '@/lib/ai/context-builder'
import { DesignGenerator } from '@/components/design/DesignGenerator'

export default async function DesignsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const workflowContext = await getDesignWorkflowContext(projectId)

  // Load existing design artifacts from dedicated table
  const { data: artifacts } = await supabase
    .from('design_artifacts')
    .select('id, screen_name, type, status, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const mappedArtifacts =
    artifacts?.map((a) => ({
      id: a.id as string,
      title: a.screen_name as string,
      document_type: a.type as string,
      status: a.status as string,
      created_at: a.created_at as string,
    })) ?? []

  return (
    <DesignGenerator
      projectId={projectId}
      existingArtifacts={mappedArtifacts}
      workflowContext={workflowContext}
    />
  )
}
