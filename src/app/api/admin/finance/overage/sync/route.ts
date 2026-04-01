import { createClient } from '@/lib/supabase/server'
import { syncMonthOverage } from '@/lib/plans/overage'

export const maxDuration = 30

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
 * POST /api/admin/finance/overage/sync
 * Body: { month: "YYYY-MM" }
 * Computes overage for all users in the given month and upserts into overage_ledger.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const user = await assertAdmin(supabase)
  if (!user) return new Response('Forbidden', { status: 403 })

  const body = await request.json().catch(() => ({}))
  const month: string = body.month

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return Response.json(
      { error: 'validation_error', message: 'month must be YYYY-MM format' },
      { status: 400 },
    )
  }

  const result = await syncMonthOverage(month)

  return Response.json({
    month,
    synced: result.synced,
    errors: result.errors,
  })
}
