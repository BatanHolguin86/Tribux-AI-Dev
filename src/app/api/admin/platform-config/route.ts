import { requireSuperAdmin } from '@/lib/admin/require-super-admin'
import { createAdminClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto/encrypt'
import { savePlatformConfigSchema } from '@/lib/validations/admin'

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.allowed) return Response.json(auth.body, { status: auth.status })

  try {
    const supabase = await createAdminClient()
    const { data: rows, error } = await supabase
      .from('platform_config')
      .select('provider, is_connected, last_tested_at, test_result, metadata')
      .order('provider')

    if (error) {
      // Table might not exist yet (migration not applied)
      console.error('[platform-config] Query error:', error.message)
      return Response.json({ providers: [] })
    }

    return Response.json({
      providers: (rows ?? []).map((r) => ({
        ...r,
        has_token: true,
      })),
    })
  } catch (err) {
    console.error('[platform-config] Error:', err)
    return Response.json({ providers: [] })
  }
}

export async function PUT(request: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.allowed) return Response.json(auth.body, { status: auth.status })

  const body = await request.json()
  const parsed = savePlatformConfigSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { provider, token, metadata } = parsed.data
  const encryptedToken = encrypt(token)

  const supabase = await createAdminClient()

  // Upsert: insert or update
  const { data: existing } = await supabase
    .from('platform_config')
    .select('id')
    .eq('provider', provider)
    .single()

  if (existing) {
    await supabase
      .from('platform_config')
      .update({
        encrypted_token: encryptedToken,
        metadata: metadata ?? {},
        is_connected: true,
        updated_by: auth.userId,
      })
      .eq('provider', provider)
  } else {
    await supabase.from('platform_config').insert({
      provider,
      encrypted_token: encryptedToken,
      metadata: metadata ?? {},
      is_connected: true,
      updated_by: auth.userId,
    })
  }

  return Response.json({ success: true })
}
