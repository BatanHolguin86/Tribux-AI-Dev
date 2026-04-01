import { createClient } from '@/lib/supabase/server'
import { getUserQuota } from '@/lib/plans/quota'

export const maxDuration = 10

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const quota = await getUserQuota(user.id)
  return Response.json(quota)
}
