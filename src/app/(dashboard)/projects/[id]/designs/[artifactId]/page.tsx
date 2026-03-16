import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArtifactDetail } from '@/components/design/ArtifactDetail'

export default async function ArtifactDetailPage({
  params,
}: {
  params: Promise<{ id: string; artifactId: string }>
}) {
  const { id: projectId, artifactId } = await params
  const supabase = await createClient()

  const { data: artifact } = await supabase
    .from('design_artifacts')
    .select('*')
    .eq('id', artifactId)
    .eq('project_id', projectId)
    .single()

  if (!artifact) {
    notFound()
  }

  // Fetch content from storage
  let content: string | null = null
  if (artifact.storage_path) {
    const { data: fileData } = await supabase.storage
      .from('project-designs')
      .download(artifact.storage_path)

    if (fileData) {
      content = await fileData.text()
    }
  }

  return (
    <ArtifactDetail
      projectId={projectId}
      artifact={{
        id: artifact.id,
        type: artifact.type,
        screen_name: artifact.screen_name,
        status: artifact.status,
        created_at: artifact.created_at,
      }}
      content={content}
    />
  )
}
