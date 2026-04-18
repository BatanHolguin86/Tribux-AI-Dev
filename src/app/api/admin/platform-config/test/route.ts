import { requireSuperAdmin } from '@/lib/admin/require-super-admin'
import { testPlatformConfigSchema } from '@/lib/validations/admin'

export async function POST(request: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.allowed) return Response.json(auth.body, { status: auth.status })

  const body = await request.json()
  const parsed = testPlatformConfigSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'invalid_input' }, { status: 400 })
  }

  const { provider, token } = parsed.data

  try {
    if (provider === 'github') {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Tribux AI',
        },
      })
      if (!res.ok) throw new Error(`GitHub API: ${res.status}`)
      const data = await res.json()
      return Response.json({ success: true, details: `Conectado como ${data.login}` })
    }

    if (provider === 'supabase') {
      const res = await fetch('https://api.supabase.com/v1/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Supabase API: ${res.status}`)
      const projects = await res.json()
      return Response.json({ success: true, details: `${(projects as unknown[]).length} proyecto(s) encontrados` })
    }

    if (provider === 'vercel') {
      const res = await fetch('https://api.vercel.com/v2/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Vercel API: ${res.status}`)
      const data = await res.json()
      return Response.json({ success: true, details: `Conectado como ${data.user?.username ?? 'usuario'}` })
    }

    return Response.json({ error: 'unknown_provider' }, { status: 400 })
  } catch (err) {
    return Response.json({
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexion',
    })
  }
}
