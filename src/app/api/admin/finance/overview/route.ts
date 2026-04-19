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
  const fromParam = searchParams.get('from') // YYYY-MM
  const toParam = searchParams.get('to')     // YYYY-MM

  const now = new Date()
  const nowMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Period: from → to (inclusive)
  const periodFrom = fromParam || nowMonth
  const periodTo = toParam || nowMonth
  const currentMonthStart = `${periodFrom}-01`
  const endMonthDate = new Date(`${periodTo}-01`)
  endMonthDate.setMonth(endMonthDate.getMonth() + 1)
  const currentMonthEnd = endMonthDate.toISOString().slice(0, 10) + 'T00:00:00Z'

  // Calculate number of months in range
  const fromDate = new Date(currentMonthStart)
  const toDate = new Date(`${periodTo}-01`)
  const rangeMonths = Math.max(1, (toDate.getFullYear() - fromDate.getFullYear()) * 12 + toDate.getMonth() - fromDate.getMonth() + 1)

  // Previous period (same length, before start)
  const prevStartDate = new Date(currentMonthStart)
  prevStartDate.setMonth(prevStartDate.getMonth() - rangeMonths)
  const prevMonthStart = `${prevStartDate.getFullYear()}-${String(prevStartDate.getMonth() + 1).padStart(2, '0')}-01`

  const currentMonthStr = periodFrom

  const [profilesRes, usageCurrentRes, usagePrevRes, costTargetsRes, creditsRes] = await Promise.all([
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
    supabase
      .from('plan_cost_targets')
      .select('plan, monthly_ai_budget_usd, plan_price_usd, target_margin_pct'),
    supabase
      .from('credit_purchases')
      .select('user_id, amount_usd, price_usd')
      .gte('month', periodFrom)
      .lte('month', periodTo)
      .eq('status', 'completed'),
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
  const costTargets = costTargetsRes.data ?? []

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

  // Aggregate credit purchases by user
  const creditsByUser: Record<string, { purchased: number; revenue: number }> = {}
  for (const c of creditsRes.data ?? []) {
    if (!creditsByUser[c.user_id]) creditsByUser[c.user_id] = { purchased: 0, revenue: 0 }
    creditsByUser[c.user_id].purchased += Number(c.amount_usd ?? 0)
    creditsByUser[c.user_id].revenue += Number(c.price_usd ?? 0)
  }
  const totalCreditRevenue = Object.values(creditsByUser).reduce((s, c) => s + c.revenue, 0)

  const planPrice: Record<string, number> = {
    starter: 49,
    builder: 149,
    pro: 299,
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
      creditsPurchasedUsd: creditsByUser[p.id]?.purchased ?? 0,
      creditsRevenueUsd: creditsByUser[p.id]?.revenue ?? 0,
    }
  })

  const totalAiCost = rows.reduce((s, r) => s + r.costCurrentMonthUsd, 0)
  const totalPlanRevenue = rows
    .filter((r) => r.subscriptionStatus === 'active' || r.subscriptionStatus === 'trialing')
    .reduce((s, r) => s + r.planPriceUsd, 0)
  const totalRevenue = totalPlanRevenue + totalCreditRevenue

  // Infrastructure costs (monthly estimates — update via env vars or here)
  // Operational costs: read from DB (managed by admin in backoffice)
  const { data: dbCosts } = await supabase
    .from('operational_costs')
    .select('id, label, description, monthly_usd')
    .order('label')

  const operationalCosts = (dbCosts ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    description: c.description ?? '',
    monthlyUsd: Number(c.monthly_usd),
  }))

  const monthlyInfraCost = operationalCosts.reduce((s, c) => s + c.monthlyUsd, 0)
  const totalInfraCost = monthlyInfraCost * rangeMonths

  // Legacy infraCosts object for backward compatibility
  const infraCosts = {
    supabase: 0, vercel: 0, anthropicPlatform: 0,
    domain: 0, sentry: 0, resend: 0, other: 0,
  }
  const totalCosts = totalAiCost + totalInfraCost
  const netProfit = totalRevenue - totalCosts

  // Breakeven calculation (based on trackable costs only)
  const starterPrice = planPrice.starter || 49
  const avgCostPerUser = rows.length > 0 ? totalAiCost / Math.max(1, rows.filter(r => r.subscriptionStatus === 'active' || r.subscriptionStatus === 'trialing').length) : 0
  const breakEvenUsers = totalCosts > 0 ? Math.ceil(totalCosts / (starterPrice - avgCostPerUser)) : 0

  const summary = {
    totalUsers: rows.length,
    totalCostCurrentMonthUsd: totalAiCost,
    totalCostPreviousMonthUsd: rows.reduce((s, r) => s + r.costPreviousMonthUsd, 0),
    totalRevenueCurrentMonthUsd: totalRevenue,
    totalPlanRevenueUsd: totalPlanRevenue,
    totalCreditRevenueUsd: totalCreditRevenue,
    totalInfraCostUsd: totalInfraCost,
    totalCostsUsd: totalCosts,
    netProfitUsd: netProfit,
    infraCosts,
    rangeMonths,
    periodStart: periodFrom,
    periodEnd: periodTo,
    ownerView: {
      breakEvenUsers,
      activePayingUsers: rows.filter(r => r.subscriptionStatus === 'active').length,
      trialUsers: rows.filter(r => r.subscriptionStatus === 'trialing').length,
    },
  }

  // Golden Record: per-plan actual vs target cost comparison
  const planGoldenRecord = costTargets.map((target) => {
    const planUsers = rows.filter((r) => r.plan === target.plan)
    const activeUsers = planUsers.filter(
      (r) => r.subscriptionStatus === 'active' || r.subscriptionStatus === 'trialing',
    )
    const totalCostForPlan = planUsers.reduce((s, r) => s + r.costCurrentMonthUsd, 0)
    const avgCostPerUser =
      activeUsers.length > 0 ? totalCostForPlan / activeUsers.length : 0
    const budgetUsedPct =
      target.monthly_ai_budget_usd > 0
        ? Math.round((avgCostPerUser / Number(target.monthly_ai_budget_usd)) * 100)
        : 0
    const usersAboveBudget = planUsers.filter(
      (r) => r.costCurrentMonthUsd > Number(target.monthly_ai_budget_usd),
    ).length

    return {
      plan: target.plan,
      planPriceUsd: Number(target.plan_price_usd),
      monthlyBudgetUsd: Number(target.monthly_ai_budget_usd),
      targetMarginPct: Number(target.target_margin_pct),
      totalUsersOnPlan: planUsers.length,
      activeUsersOnPlan: activeUsers.length,
      totalCostForPlanUsd: Math.round(totalCostForPlan * 100) / 100,
      avgCostPerUserUsd: Math.round(avgCostPerUser * 10000) / 10000,
      budgetUsedPct,
      usersAboveBudget,
      // Risk flag: avg cost > 80% of budget
      atRisk: budgetUsedPct >= 80,
    }
  })

  return NextResponse.json({
    summary,
    users: rows,
    planGoldenRecord,
    operationalCosts,
  })
}
