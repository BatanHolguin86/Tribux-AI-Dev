import { createClient } from '@/lib/supabase/server'
import { importV0Schema } from '@/lib/validations/designs'
import { checkRateLimit, getClientIp, EXTERNAL_IMPORT_RATE_LIMIT } from '@/lib/rate-limit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    // Rate limit
    const ip = getClientIp(request)
    const rateResult = checkRateLimit(`import-v0:${user.id}:${ip}`, EXTERNAL_IMPORT_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json({ error: 'rate_limited' }, { status: 429 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return Response.json({ error: 'not_found' }, { status: 404 })

    const body = await request.json()
    const parsed = importV0Schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { content, screen_name, type, source_url } = parsed.data
    const storagePath = `projects/${projectId}/designs/v0-${Date.now()}.html`

    const { data: artifact, error } = await supabase
      .from('design_artifacts')
      .insert({
        project_id: projectId,
        type,
        screen_name,
        storage_path: storagePath,
        mime_type: 'text/html',
        status: 'draft',
        content,
        source: 'v0',
        external_url: source_url ?? null,
      })
      .select('id')
      .single()

    if (error) {
      return Response.json({ error: 'insert_failed', message: error.message }, { status: 500 })
    }

    // Upload to storage (best-effort)
    await supabase.storage
      .from('project-designs')
      .upload(storagePath, content, { contentType: 'text/html', upsert: true })
      .catch((err: unknown) => console.error('[v0-import] Storage error:', err))

    return Response.json({ success: true, artifactId: artifact.id })
  } catch (error) {
    console.error('[v0-import] Error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
