import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { name, content, phase_number } = body as {
    name: string
    content: string
    phase_number: number | null
  }

  if (!name || !content) {
    return NextResponse.json({ error: 'Nombre y contenido son requeridos' }, { status: 400 })
  }

  const slug = slugify(name)
  const storagePath = `projects/${projectId}/artifacts/${slug}.md`

  // Store in Supabase Storage
  await supabase.storage
    .from('project-documents')
    .upload(storagePath, content, {
      contentType: 'text/markdown',
      upsert: true,
    })

  // Register in project_documents
  const { data: doc, error } = await supabase
    .from('project_documents')
    .insert({
      project_id: projectId,
      phase_number: phase_number,
      section: name,
      document_type: 'artifact',
      storage_path: storagePath,
      content,
      version: 1,
      status: 'draft',
    })
    .select('id, storage_path')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(doc, { status: 201 })
}
