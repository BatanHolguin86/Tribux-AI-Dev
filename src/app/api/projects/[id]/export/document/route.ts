import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/projects/[id]/export/document?type=<type>&docId=<id>
 * Downloads an individual document as .md
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return new Response('Not found', { status: 404 })
  }

  const url = new URL(request.url)
  const type = url.searchParams.get('type')
  const docId = url.searchParams.get('docId')

  if (!type || !docId) {
    return Response.json({ error: 'Missing type or docId' }, { status: 400 })
  }

  let title = 'document'
  let content = ''

  if (type === 'project_document') {
    const { data } = await supabase
      .from('project_documents')
      .select('title, content, section, phase_number')
      .eq('id', docId)
      .eq('project_id', projectId)
      .single()

    if (!data) return new Response('Document not found', { status: 404 })
    title = data.title ?? data.section ?? 'document'
    content = `# ${title}\n\n${data.content ?? ''}`
  } else if (type === 'feature_document') {
    const { data } = await supabase
      .from('feature_documents')
      .select('doc_type, content, feature_id')
      .eq('id', docId)
      .single()

    if (!data) return new Response('Document not found', { status: 404 })

    // Get feature name
    const { data: feature } = await supabase
      .from('project_features')
      .select('name')
      .eq('id', data.feature_id)
      .single()

    title = `${feature?.name ?? 'Feature'} — ${data.doc_type}`
    content = `# ${title}\n\n${data.content ?? ''}`
  } else if (type === 'knowledge_entry') {
    const { data } = await supabase
      .from('knowledge_base_entries')
      .select('title, content, category')
      .eq('id', docId)
      .eq('project_id', projectId)
      .single()

    if (!data) return new Response('Entry not found', { status: 404 })
    title = data.title
    content = `# ${data.title}\n\n**Categoria:** ${data.category}\n\n${data.content ?? ''}`
  } else {
    return Response.json({ error: 'Invalid type' }, { status: 400 })
  }

  const filename = `${slugify(title)}.md`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
