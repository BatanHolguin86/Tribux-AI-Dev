import { createClient } from '@/lib/supabase/server'
import { importLovableSchema } from '@/lib/validations/designs'
import { checkRateLimit, getClientIp, EXTERNAL_IMPORT_RATE_LIMIT } from '@/lib/rate-limit'
import { parseLovableUrl } from '@/lib/integrations/lovable'

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
    const rateResult = checkRateLimit(`import-lovable:${user.id}:${ip}`, EXTERNAL_IMPORT_RATE_LIMIT)
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
    const parsed = importLovableSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { lovable_url, screen_name, type } = parsed.data

    if (!parseLovableUrl(lovable_url)) {
      return Response.json({ error: 'invalid_url', message: 'URL de Lovable invalida.' }, { status: 400 })
    }

    const { data: artifact, error } = await supabase
      .from('design_artifacts')
      .insert({
        project_id: projectId,
        type,
        screen_name,
        storage_path: `external/lovable/${Date.now()}`,
        mime_type: 'text/html',
        status: 'draft',
        source: 'lovable',
        external_url: lovable_url,
      })
      .select('id')
      .single()

    if (error) {
      return Response.json({ error: 'insert_failed', message: error.message }, { status: 500 })
    }

    return Response.json({ success: true, artifactId: artifact.id })
  } catch (error) {
    console.error('[lovable-import] Error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
