import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; artifactId: string }> },
) {
  const { id: projectId, artifactId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: artifact, error } = await supabase
    .from('design_artifacts')
    .select('*')
    .eq('id', artifactId)
    .eq('project_id', projectId)
    .single()

  if (error || !artifact) {
    return NextResponse.json({ error: 'Artefacto no encontrado' }, { status: 404 })
  }

  // Get signed URL for the stored file if path exists
  let signedUrl: string | null = null
  let content: string | null = null

  if (artifact.storage_path) {
    const { data: urlData } = await supabase.storage
      .from('project-designs')
      .createSignedUrl(artifact.storage_path, 3600) // 1 hour expiry

    signedUrl = urlData?.signedUrl ?? null

    // For markdown files, also fetch content directly
    if (artifact.mime_type === 'text/markdown') {
      const { data: fileData } = await supabase.storage
        .from('project-designs')
        .download(artifact.storage_path)

      if (fileData) {
        content = await fileData.text()
      }
    }
  }

  return NextResponse.json({
    artifact,
    signedUrl,
    content,
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; artifactId: string }> },
) {
  const { id: projectId, artifactId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { status } = body

  if (!status || !['draft', 'approved'].includes(status)) {
    return NextResponse.json(
      { error: 'Estado invalido. Usa "draft" o "approved".' },
      { status: 400 },
    )
  }

  const { data: artifact, error } = await supabase
    .from('design_artifacts')
    .update({ status })
    .eq('id', artifactId)
    .eq('project_id', projectId)
    .select('id, status')
    .single()

  if (error || !artifact) {
    return NextResponse.json({ error: 'Error al actualizar artefacto' }, { status: 500 })
  }

  return NextResponse.json(artifact)
}
