import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 10

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
 * GET /api/admin/finance/overage
 * Returns overage_ledger entries with user email, optionally filtered by month.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const user = await assertAdmin(supabase)
  if (!user) return new Response('Forbidden', { status: 403 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // YYYY-MM, optional

  const admin = await createAdminClient()

  let query = admin
    .from('overage_ledger')
    .select(`
      id, user_id, month, plan, budget_usd, used_usd,
      overage_usd, overage_multiplier, charge_usd,
      stripe_invoice_item_id, stripe_invoice_id,
      status, error_message, billed_at, created_at
    `)
    .order('month', { ascending: false })
    .order('charge_usd', { ascending: false })

  if (month) query = query.eq('month', month)

  const { data: entries, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Enrich with user emails
  const userIds = [...new Set((entries ?? []).map((e) => e.user_id))]
  const { data: authUsers } = await admin.auth.admin.listUsers()
  const emailById = new Map<string, string>()
  for (const u of authUsers?.users ?? []) {
    if (userIds.includes(u.id)) emailById.set(u.id, u.email ?? u.id)
  }

  const enriched = (entries ?? []).map((e) => ({
    ...e,
    userEmail: emailById.get(e.user_id) ?? e.user_id,
  }))

  return Response.json(enriched)
}
