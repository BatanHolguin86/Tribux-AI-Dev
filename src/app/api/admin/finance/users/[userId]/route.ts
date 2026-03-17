import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'

/**
 * GET /api/admin/finance/users/[userId]
 * Detail of one user: profile + AI usage by month and by event type.
 * Only for financial_admin and super_admin.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const { userId } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const months = Math.min(Math.max(1, parseInt(searchParams.get('months') ?? '12', 10)), 24)

  const [profileRes, usageRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, full_name, plan, subscription_status, trial_ends_at, created_at, role')
      .eq('id', userId)
      .single(),
    supabase
      .from('ai_usage_events')
      .select('id, project_id, event_type, model, input_tokens, output_tokens, estimated_cost_usd, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5000),
  ])

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json(
      { error: 'not_found', message: 'Usuario no encontrado' },
      { status: 404 },
    )
  }

  const profile = profileRes.data
  const events = usageRes.data ?? []

  const planPrice: Record<string, number> = {
    starter: 149,
    builder: 299,
    agency: 699,
    enterprise: 0,
  }
  const price = planPrice[profile.plan] ?? 0

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const cutoffIso = cutoff.toISOString()

  const byMonth: Record<
    string,
    { cost: number; inputTokens: number; outputTokens: number; events: number }
  > = {}
  const byEventType: Record<
    string,
    { cost: number; inputTokens: number; outputTokens: number; count: number }
  > = {}

  for (const e of events) {
    if (e.created_at < cutoffIso) continue
    const monthKey = e.created_at.slice(0, 7)
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { cost: 0, inputTokens: 0, outputTokens: 0, events: 0 }
    }
    byMonth[monthKey].cost += Number(e.estimated_cost_usd ?? 0)
    byMonth[monthKey].inputTokens += Number(e.input_tokens ?? 0)
    byMonth[monthKey].outputTokens += Number(e.output_tokens ?? 0)
    byMonth[monthKey].events += 1

    const et = e.event_type ?? 'unknown'
    if (!byEventType[et]) {
      byEventType[et] = { cost: 0, inputTokens: 0, outputTokens: 0, count: 0 }
    }
    byEventType[et].cost += Number(e.estimated_cost_usd ?? 0)
    byEventType[et].inputTokens += Number(e.input_tokens ?? 0)
    byEventType[et].outputTokens += Number(e.output_tokens ?? 0)
    byEventType[et].count += 1
  }

  const monthlyBreakdown = Object.entries(byMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, data]) => ({
      month,
      ...data,
      costUsd: Math.round(data.cost * 1e6) / 1e6,
    }))

  const eventTypeBreakdown = Object.entries(byEventType).map(([eventType, data]) => ({
    eventType,
    ...data,
    costUsd: Math.round(data.cost * 1e6) / 1e6,
  }))

  const totalCostAllTime = events.reduce((s, e) => s + Number(e.estimated_cost_usd ?? 0), 0)

  return NextResponse.json({
    user: {
      userId: profile.id,
      fullName: profile.full_name,
      plan: profile.plan,
      subscriptionStatus: profile.subscription_status,
      trialEndsAt: profile.trial_ends_at,
      createdAt: profile.created_at,
      role: profile.role,
      planPriceUsd: price,
    },
    totalCostAllTimeUsd: Math.round(totalCostAllTime * 1e6) / 1e6,
    monthlyBreakdown,
    eventTypeBreakdown,
    recentEvents: events.slice(0, 100).map((e) => ({
      id: e.id,
      projectId: e.project_id,
      eventType: e.event_type,
      model: e.model,
      inputTokens: e.input_tokens,
      outputTokens: e.output_tokens,
      estimatedCostUsd: e.estimated_cost_usd,
      createdAt: e.created_at,
    })),
  })
}
