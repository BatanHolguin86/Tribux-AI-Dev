import { createClient } from '@/lib/supabase/server'
import { billOverageEntry } from '@/lib/plans/overage'

export const maxDuration = 15

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['financial_admin', 'super_admin'].includes(profile.role)) return null
  return user
}

/**
 * POST /api/admin/finance/overage/[ledgerId]/bill
 * Creates a Stripe Invoice Item for the overage entry and marks it as billed.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ ledgerId: string }> },
) {
  const supabase = await createClient()
  const user = await assertAdmin(supabase)
  if (!user) return new Response('Forbidden', { status: 403 })

  const { ledgerId } = await params
  const result = await billOverageEntry(ledgerId)

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  return Response.json({ ok: true })
}
