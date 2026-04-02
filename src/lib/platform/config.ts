import { createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto/encrypt'

type PlatformProvider = 'github' | 'supabase' | 'vercel'

type PlatformTokenResult = {
  token: string
  metadata: Record<string, string>
}

// In-memory cache (per serverless instance, ~60s TTL)
const cache = new Map<string, { data: PlatformTokenResult; expiresAt: number }>()
const CACHE_TTL = 60_000

/**
 * Resolve platform token: DB first (platform_config table), env var fallback.
 * Caches for 60 seconds to avoid repeated DB queries.
 */
export async function getPlatformToken(provider: PlatformProvider): Promise<PlatformTokenResult> {
  // Check cache
  const cached = cache.get(provider)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data
  }

  // Try DB first
  try {
    const supabase = await createAdminClient()
    const { data: row } = await supabase
      .from('platform_config')
      .select('encrypted_token, metadata, is_connected')
      .eq('provider', provider)
      .single()

    if (row?.is_connected && row.encrypted_token) {
      const token = decrypt(row.encrypted_token)
      const metadata = (row.metadata ?? {}) as Record<string, string>
      const result = { token, metadata }
      cache.set(provider, { data: result, expiresAt: Date.now() + CACHE_TTL })
      return result
    }
  } catch {
    // DB not available or table doesn't exist — fallback to env
  }

  // Fallback to env vars
  const envMap: Record<PlatformProvider, { tokenKey: string; metaKeys: Record<string, string> }> = {
    github: {
      tokenKey: 'PLATFORM_GITHUB_TOKEN',
      metaKeys: { org: 'PLATFORM_GITHUB_ORG' },
    },
    supabase: {
      tokenKey: 'PLATFORM_SUPABASE_TOKEN',
      metaKeys: { org_id: 'PLATFORM_SUPABASE_ORG_ID' },
    },
    vercel: {
      tokenKey: 'PLATFORM_VERCEL_TOKEN',
      metaKeys: { team_id: 'PLATFORM_VERCEL_TEAM_ID' },
    },
  }

  const config = envMap[provider]
  const token = process.env[config.tokenKey]
  if (!token) {
    throw new Error(`Platform token for ${provider} not configured (DB or env)`)
  }

  const metadata: Record<string, string> = {}
  for (const [key, envVar] of Object.entries(config.metaKeys)) {
    const value = process.env[envVar]
    if (value) metadata[key] = value
  }

  const result = { token, metadata }
  cache.set(provider, { data: result, expiresAt: Date.now() + CACHE_TTL })
  return result
}

/**
 * Check if platform tokens are available (from DB or env).
 * Non-throwing — returns false if not configured.
 */
export async function isPlatformReady(): Promise<boolean> {
  try {
    await getPlatformToken('github')
    await getPlatformToken('supabase')
    await getPlatformToken('vercel')
    return true
  } catch {
    return false
  }
}
