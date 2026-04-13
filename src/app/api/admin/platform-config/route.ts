import { requireSuperAdmin } from '@/lib/admin/require-super-admin'
import { createAdminClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto/encrypt'
import { savePlatformConfigSchema } from '@/lib/validations/admin'

// Env var names for each provider (fallback when DB has no tokens)
const ENV_CHECK: Record<string, { tokenKey: string; metaKeys: Record<string, string> }> = {
  github: { tokenKey: 'PLATFORM_GITHUB_TOKEN', metaKeys: { org: 'PLATFORM_GITHUB_ORG' } },
  supabase: { tokenKey: 'PLATFORM_SUPABASE_TOKEN', metaKeys: { org_id: 'PLATFORM_SUPABASE_ORG_ID' } },
  vercel: { tokenKey: 'PLATFORM_VERCEL_TOKEN', metaKeys: { team_id: 'PLATFORM_VERCEL_TEAM_ID' } },
}

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
      console.error('[platform-config] Query error:', error.message)
    }

    const dbMap = new Map((rows ?? []).map((r) => [r.provider, r]))

    // Merge DB rows with env var fallback — show "connected" if either source has a token
    const providers = ['github', 'supabase', 'vercel'].map((provider) => {
      const dbRow = dbMap.get(provider)
      const envCfg = ENV_CHECK[provider]
      const hasEnvToken = !!process.env[envCfg.tokenKey]

      // Build metadata from env if DB has none
      const envMetadata: Record<string, string> = {}
      if (hasEnvToken) {
        for (const [key, envVar] of Object.entries(envCfg.metaKeys)) {
          const val = process.env[envVar]
          if (val) envMetadata[key] = val
        }
      }

      if (dbRow) {
        return {
          ...dbRow,
          has_token: true,
          source: 'db' as const,
        }
      }

      if (hasEnvToken) {
        return {
          provider,
          is_connected: true,
          has_token: true,
          last_tested_at: null,
          test_result: 'env_var',
          metadata: envMetadata,
          source: 'env' as const,
        }
      }

      return {
        provider,
        is_connected: false,
        has_token: false,
        last_tested_at: null,
        test_result: null,
        metadata: {},
        source: 'none' as const,
      }
    })

    return Response.json({ providers })
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
