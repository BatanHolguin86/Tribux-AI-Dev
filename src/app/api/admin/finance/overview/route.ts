import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'

/**
 * GET /api/admin/finance/overview
 * List all users with profile and aggregated AI costs (current month, previous month).
 * Only for financial_admin and super_admin.
 */
export async function GET(request: Request) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // optional: YYYY-MM to override "current" month

  const now = new Date()
  const currentMonthStart = month
    ? `${month}-01`
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const currentMonthEndDate = new Date(currentMonthStart)
  currentMonthEndDate.setMonth(currentMonthEndDate.getMonth() + 1)
  const currentMonthEnd = currentMonthEndDate.toISOString().slice(0, 10) + 'T00:00:00Z'
  const prevMonthEndDate = new Date(currentMonthStart)
  prevMonthEndDate.setDate(0)
  const prevMonthStart =
    `${prevMonthEndDate.getFullYear()}-${String(prevMonthEndDate.getMonth() + 1).padStart(2, '0')}-01`

  const [profilesRes, usageCurrentRes, usagePrevRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, full_name, plan, subscription_status, trial_ends_at, created_at, role')
      .order('created_at', { ascending: false }),
    supabase
      .from('ai_usage_events')
      .select('user_id, estimated_cost_usd, input_tokens, output_tokens')
      .gte('created_at', currentMonthStart)
      .lt('created_at', currentMonthEnd),
    supabase
      .from('ai_usage_events')
      .select('user_id, estimated_cost_usd')
      .gte('created_at', prevMonthStart)
      .lt('created_at', currentMonthStart),
  ])

  if (profilesRes.error) {
    return NextResponse.json(
      { error: 'db_error', message: profilesRes.error.message },
      { status: 500 },
    )
  }

  const profiles = profilesRes.data ?? []
  const usageCurrent = usageCurrentRes.data ?? []
  const usagePrev = usagePrevRes.data ?? []

  const aggregateByUser = (rows: Array<{ user_id: string; estimated_cost_usd?: number; input_tokens?: number; output_tokens?: number }>) => {
    const map: Record<
      string,
      { cost: number; inputTokens: number; outputTokens: number }
    > = {}
    for (const r of rows) {
      if (!map[r.user_id]) {
        map[r.user_id] = { cost: 0, inputTokens: 0, outputTokens: 0 }
      }
      map[r.user_id].cost += Number(r.estimated_cost_usd ?? 0)
      map[r.user_id].inputTokens += Number(r.input_tokens ?? 0)
      map[r.user_id].outputTokens += Number(r.output_tokens ?? 0)
    }
    return map
  }

  const currentByUser = aggregateByUser(usageCurrent)
  const prevByUser = aggregateByUser(usagePrev)

  const planPrice: Record<string, number> = {
    starter: 149,
    builder: 299,
    agency: 699,
    enterprise: 0, // custom
  }

  const rows = profiles.map((p) => {
    const currentCost = currentByUser[p.id]?.cost ?? 0
    const prevCost = prevByUser[p.id]?.cost ?? 0
    const price = planPrice[p.plan] ?? 0
    const margin = price > 0 ? (price - currentCost) / price : 0
    return {
      userId: p.id,
      fullName: p.full_name,
      plan: p.plan,
      subscriptionStatus: p.subscription_status,
      trialEndsAt: p.trial_ends_at,
      createdAt: p.created_at,
      role: p.role,
      costCurrentMonthUsd: Math.round(currentCost * 1e6) / 1e6,
      costPreviousMonthUsd: Math.round(prevCost * 1e6) / 1e6,
      planPriceUsd: price,
      marginRatio: Math.round(margin * 100) / 100,
      inputTokensCurrentMonth: currentByUser[p.id]?.inputTokens ?? 0,
      outputTokensCurrentMonth: currentByUser[p.id]?.outputTokens ?? 0,
    }
  })

  const summary = {
    totalUsers: rows.length,
    totalCostCurrentMonthUsd: rows.reduce((s, r) => s + r.costCurrentMonthUsd, 0),
    totalCostPreviousMonthUsd: rows.reduce((s, r) => s + r.costPreviousMonthUsd, 0),
    totalRevenueCurrentMonthUsd: rows
      .filter((r) => r.subscriptionStatus === 'active' || r.subscriptionStatus === 'trialing')
      .reduce((s, r) => s + r.planPriceUsd, 0),
  }

  return NextResponse.json({
    summary,
    users: rows,
  })
}
