import { requireSuperAdmin } from '@/lib/admin/require-super-admin'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const auth = await requireSuperAdmin()
  if (!auth.allowed) return Response.json(auth.body, { status: auth.status })

  const { provider } = await params

  if (!['github', 'supabase', 'vercel'].includes(provider)) {
    return Response.json({ error: 'invalid_provider' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  await supabase.from('platform_config').delete().eq('provider', provider)

  return Response.json({ success: true })
}
