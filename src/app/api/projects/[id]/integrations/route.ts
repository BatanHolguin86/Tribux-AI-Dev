import { createClient } from '@/lib/supabase/server'
import { saveIntegrationSchema } from '@/lib/validations/designs'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = saveIntegrationSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
    }

    const updates: Record<string, string | null> = {}
    if (parsed.data.figma_token !== undefined) updates.figma_token = parsed.data.figma_token
    if (parsed.data.v0_api_key !== undefined) updates.v0_api_key = parsed.data.v0_api_key

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'no_updates' }, { status: 400 })
    }

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)

    if (error) {
      return Response.json({ error: 'update_failed', message: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[integrations] Error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const body = await request.json().catch(() => ({}))
    const provider = (body as Record<string, unknown>).provider as string

    if (!['figma', 'v0'].includes(provider)) {
      return Response.json({ error: 'invalid_provider' }, { status: 400 })
    }

    const field = provider === 'figma' ? 'figma_token' : 'v0_api_key'

    await supabase
      .from('projects')
      .update({ [field]: null })
      .eq('id', projectId)
      .eq('user_id', user.id)

    return Response.json({ success: true })
  } catch (error) {
    console.error('[integrations] Delete error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
