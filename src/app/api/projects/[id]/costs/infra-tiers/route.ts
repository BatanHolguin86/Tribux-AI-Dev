import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TiersSchema = z.object({
  github:   z.enum(['free', 'teams', 'enterprise']).optional(),
  supabase: z.enum(['free', 'pro', 'teams']).optional(),
  vercel:   z.enum(['hobby', 'pro', 'enterprise']).optional(),
  sentry:   z.enum(['free', 'team', 'business']).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const body = await request.json()
    const parsed = TiersSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'invalid_tiers', details: parsed.error.flatten() }, { status: 400 })
    }

    const { error } = await supabase
      .from('projects')
      .update({ infra_tiers: parsed.data, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (error) {
      return Response.json({ error: 'update_failed', message: error.message }, { status: 500 })
    }

    return Response.json({ ok: true, infraTiers: parsed.data })
  } catch (error) {
    console.error('[costs/infra-tiers] Error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
