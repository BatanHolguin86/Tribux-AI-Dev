import { createClient } from '@/lib/supabase/server'
import { createKBEntrySchema } from '@/lib/validations/knowledge'

const PAGE_SIZE = 20

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const category = url.searchParams.get('category')
  const phase = url.searchParams.get('phase')
  const q = url.searchParams.get('q')
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('knowledge_base_entries')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (category) {
    query = query.eq('category', category)
  }

  if (phase !== null && phase !== '') {
    query = query.eq('phase_number', parseInt(phase))
  }

  if (q && q.trim()) {
    query = query.textSearch('search_vector', q.trim(), { type: 'websearch', config: 'spanish' })
  }

  const { data, count, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    entries: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = createKBEntrySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { title, content, category, summary, tags } = parsed.data

  const { data, error } = await supabase
    .from('knowledge_base_entries')
    .insert({
      project_id: projectId,
      category,
      title,
      content,
      summary: summary ?? content.slice(0, 200),
      tags: tags ?? [],
      source_type: null,
      source_id: null,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}
