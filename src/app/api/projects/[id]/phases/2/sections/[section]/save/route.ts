import { createClient } from '@/lib/supabase/server'
import { SECTION_DOC_NAMES } from '@/lib/ai/prompts/phase-02'
import { uploadDocument } from '@/lib/storage/documents'
import type { Phase02Section } from '@/types/conversation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; section: string }> },
) {
  const { id: projectId, section } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { content } = (await request.json()) as { content: string }
  if (!content || typeof content !== 'string') {
    return Response.json({ error: 'Missing content' }, { status: 400 })
  }

  const sectionKey = section as Phase02Section
  const docName = SECTION_DOC_NAMES[sectionKey]
  if (!docName) {
    return Response.json({ error: 'Invalid section' }, { status: 400 })
  }

  const storagePath = `architecture/${docName}`

  // Upload to storage (best effort)
  try {
    await uploadDocument(projectId, storagePath, content)
  } catch (err) {
    console.error('[Phase02 save] uploadDocument failed', err)
  }

  // Delete existing document for this section (if any), then insert fresh
  await supabase
    .from('project_documents')
    .delete()
    .eq('project_id', projectId)
    .eq('phase_number', 2)
    .eq('section', section)

  const { error: insertError } = await supabase
    .from('project_documents')
    .insert({
      project_id: projectId,
      phase_number: 2,
      section,
      document_type: section,
      storage_path: `projects/${projectId}/${storagePath}`,
      content,
      version: 1,
      status: 'draft',
    })

  if (insertError) {
    console.error('[Phase02 save] insert failed', insertError)
    return Response.json({ error: 'Failed to save document' }, { status: 500 })
  }

  // Update section to completed
  await supabase
    .from('phase_sections')
    .update({ status: 'completed' })
    .eq('project_id', projectId)
    .eq('phase_number', 2)
    .eq('section', section)

  return Response.json({ success: true })
}
