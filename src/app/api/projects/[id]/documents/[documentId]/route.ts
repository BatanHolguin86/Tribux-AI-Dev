import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id: projectId, documentId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { content } = await request.json()

  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  // Get current document
  const { data: doc } = await supabase
    .from('project_documents')
    .select('version, storage_path')
    .eq('id', documentId)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Update storage
  await supabase.storage
    .from('project-documents')
    .upload(doc.storage_path, content, {
      contentType: 'text/markdown',
      upsert: true,
    })

  // Update DB record
  const { data: updated, error } = await supabase
    .from('project_documents')
    .update({
      content,
      version: doc.version + 1,
    })
    .eq('id', documentId)
    .select('id, version, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al actualizar documento' }, { status: 500 })
  }

  return NextResponse.json({
    document_id: updated.id,
    version: updated.version,
    updated_at: updated.updated_at,
  })
}
