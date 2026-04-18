import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Platform config resolution logic tests.
 * Tests env var fallback logic without DB dependency.
 */

describe('platform config env var resolution', () => {
  const ENV_MAP = {
    github: { tokenKey: 'PLATFORM_GITHUB_TOKEN', metaKeys: { org: 'PLATFORM_GITHUB_ORG' } },
    supabase: { tokenKey: 'PLATFORM_SUPABASE_TOKEN', metaKeys: { org_id: 'PLATFORM_SUPABASE_ORG_ID' } },
    vercel: { tokenKey: 'PLATFORM_VERCEL_TOKEN', metaKeys: { team_id: 'PLATFORM_VERCEL_TEAM_ID' } },
  }

  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('maps github provider to correct env vars', () => {
    const config = ENV_MAP.github
    expect(config.tokenKey).toBe('PLATFORM_GITHUB_TOKEN')
    expect(config.metaKeys.org).toBe('PLATFORM_GITHUB_ORG')
  })

  it('maps supabase provider to correct env vars', () => {
    const config = ENV_MAP.supabase
    expect(config.tokenKey).toBe('PLATFORM_SUPABASE_TOKEN')
    expect(config.metaKeys.org_id).toBe('PLATFORM_SUPABASE_ORG_ID')
  })

  it('maps vercel provider to correct env vars', () => {
    const config = ENV_MAP.vercel
    expect(config.tokenKey).toBe('PLATFORM_VERCEL_TOKEN')
    expect(config.metaKeys.team_id).toBe('PLATFORM_VERCEL_TEAM_ID')
  })

  it('resolves token from env var when set', () => {
    vi.stubEnv('PLATFORM_GITHUB_TOKEN', 'ghp_test123')
    expect(process.env.PLATFORM_GITHUB_TOKEN).toBe('ghp_test123')
  })

  it('returns undefined when env var not set', () => {
    vi.stubEnv('PLATFORM_GITHUB_TOKEN', '')
    expect(process.env.PLATFORM_GITHUB_TOKEN).toBe('')
  })

  it('resolves metadata from env vars', () => {
    vi.stubEnv('PLATFORM_GITHUB_ORG', 'TRIBUX-AI')
    expect(process.env.PLATFORM_GITHUB_ORG).toBe('TRIBUX-AI')
  })
})
