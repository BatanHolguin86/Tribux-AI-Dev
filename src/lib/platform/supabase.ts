import crypto from 'crypto'
import { getPlatformToken } from './config'

const SUPABASE_API = 'https://api.supabase.com'

async function getConfig() {
  const { token, metadata } = await getPlatformToken('supabase')
  const orgId = metadata.org_id
  if (!orgId) throw new Error('Supabase org ID not configured (metadata.org_id or PLATFORM_SUPABASE_ORG_ID)')
  return { token, orgId }
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function createProject(
  projectName: string,
  region: string = 'us-east-1',
): Promise<{ projectRef: string; dbPassword: string }> {
  const { token, orgId } = await getConfig()
  const dbPassword = crypto.randomBytes(24).toString('base64url')

  const res = await fetch(`${SUPABASE_API}/v1/projects`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      name: projectName,
      organization_id: orgId,
      region,
      plan: 'free',
      db_pass: dbPassword,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase create project failed (${res.status}): ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  return { projectRef: data.id, dbPassword }
}

export async function pollUntilReady(
  projectRef: string,
  onProgress?: (message: string) => void,
  maxWaitMs: number = 180_000,
): Promise<void> {
  const { token } = await getConfig()
  const start = Date.now()
  let attempt = 0

  while (Date.now() - start < maxWaitMs) {
    attempt++
    const elapsed = Math.round((Date.now() - start) / 1000)
    onProgress?.(`Esperando que Supabase este listo... (${elapsed}s)`)

    const res = await fetch(`${SUPABASE_API}/v1/projects/${projectRef}`, {
      headers: headers(token),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.status === 'ACTIVE_HEALTHY') return
    }

    // Exponential backoff: 5s, 8s, 10s, then 10s
    const delay = Math.min(5000 + attempt * 1500, 10_000)
    await new Promise((r) => setTimeout(r, delay))
  }

  throw new Error(`Supabase project ${projectRef} no estuvo listo en ${maxWaitMs / 1000}s`)
}

export async function getProjectApiKeys(
  projectRef: string,
): Promise<{ anonKey: string; serviceRoleKey: string }> {
  const { token } = await getConfig()

  const res = await fetch(`${SUPABASE_API}/v1/projects/${projectRef}/api-keys`, {
    headers: headers(token),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase get api-keys failed (${res.status}): ${text.slice(0, 300)}`)
  }

  const keys = (await res.json()) as Array<{ name: string; api_key: string }>
  const anon = keys.find((k) => k.name === 'anon')
  const serviceRole = keys.find((k) => k.name === 'service_role')

  if (!anon || !serviceRole) {
    throw new Error('Supabase API keys not found (anon or service_role missing)')
  }

  return { anonKey: anon.api_key, serviceRoleKey: serviceRole.api_key }
}

export function getProjectApiUrl(projectRef: string): string {
  return `https://${projectRef}.supabase.co`
}
