import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserQuota } from '@/lib/plans/quota'

export const maxDuration = 15

/**
 * GET /api/user/consumption
 * Returns the user's full consumption dashboard:
 * - Current month quota + credits
 * - Monthly history (last 6 months)
 * - Breakdown by event category
 * - Credit purchase history
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const admin = await createAdminClient()
  const quota = await getUserQuota(user.id)

  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthStart = `${monthStr}-01`

  // Last 6 months range
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  const historyStart = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`

  const [eventsRes, creditsRes, allEventsRes] = await Promise.all([
    // Current month by event type
    admin
      .from('ai_usage_events')
      .select('event_type, estimated_cost_usd, input_tokens, output_tokens')
      .eq('user_id', user.id)
      .gte('created_at', monthStart),
    // All credit purchases
    admin
      .from('credit_purchases')
      .select('id, amount_usd, price_usd, month, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),
    // All events for monthly history (last 6 months)
    admin
      .from('ai_usage_events')
      .select('estimated_cost_usd, created_at')
      .eq('user_id', user.id)
      .gte('created_at', historyStart),
  ])

  // Group current month events by category
  const CATEGORY_MAP: Record<string, string> = {
    agent_chat: 'chat', thread_title: 'chat', suggestions: 'chat',
    phase00_chat: 'chat', phase01_chat: 'chat', phase02_chat: 'chat',
    phase03_chat: 'chat', phase04_chat: 'chat', phase05_chat: 'chat',
    phase06_chat: 'chat', phase07_chat: 'chat',
    phase00_generate: 'docs', phase01_generate: 'docs', phase01_autodraft: 'docs',
    phase01_autodraft_specialist: 'docs', phase02_generate: 'docs',
    action_scaffold_project: 'infra', action_apply_db_schema: 'infra',
    action_configure_auth: 'infra', action_generate_env_template: 'infra',
    action_analyze_task: 'build', action_generate_task_code: 'build',
    action_auto_build_task: 'build',
    action_generate_test_plan: 'testing', action_generate_unit_tests: 'testing',
    action_generate_e2e_tests: 'testing', action_generate_qa_report: 'testing',
    action_generate_ops_runbook: 'deploy',
    action_generate_analysis_report: 'analysis',
    action_generate_backlog: 'analysis', action_generate_retrospective: 'analysis',
    design_generate: 'design', design_refine: 'design',
  }

  const CATEGORY_LABELS: Record<string, string> = {
    chat: 'Chat con agentes',
    docs: 'Generacion de documentos',
    build: 'Construccion de codigo',
    testing: 'Testing & QA',
    infra: 'Infraestructura',
    deploy: 'Deploy & operaciones',
    design: 'Diseno & UX',
    analysis: 'Analisis & iteracion',
  }

  const categoryTotals: Record<string, { cost: number; calls: number; inputTokens: number; outputTokens: number }> = {}

  for (const event of eventsRes.data ?? []) {
    const cat = CATEGORY_MAP[event.event_type] ?? 'other'
    if (!categoryTotals[cat]) categoryTotals[cat] = { cost: 0, calls: 0, inputTokens: 0, outputTokens: 0 }
    categoryTotals[cat].cost += Number(event.estimated_cost_usd ?? 0)
    categoryTotals[cat].calls += 1
    categoryTotals[cat].inputTokens += Number(event.input_tokens ?? 0)
    categoryTotals[cat].outputTokens += Number(event.output_tokens ?? 0)
  }

  const totalCost = Object.values(categoryTotals).reduce((s, c) => s + c.cost, 0)
  const categories = Object.entries(categoryTotals)
    .map(([id, data]) => ({
      id,
      label: CATEGORY_LABELS[id] ?? id,
      cost: Math.round(data.cost * 10000) / 10000,
      calls: data.calls,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      pct: totalCost > 0 ? Math.round((data.cost / totalCost) * 100) : 0,
    }))
    .sort((a, b) => b.cost - a.cost)

  // Group all events into monthly history
  const monthlyMap: Record<string, { cost: number; events: number }> = {}
  for (const event of allEventsRes.data ?? []) {
    const m = (event.created_at as string).slice(0, 7)
    if (!monthlyMap[m]) monthlyMap[m] = { cost: 0, events: 0 }
    monthlyMap[m].cost += Number(event.estimated_cost_usd ?? 0)
    monthlyMap[m].events += 1
  }

  const monthlyHistory = Object.entries(monthlyMap)
    .map(([month, data]) => ({
      month,
      costUsd: Math.round(data.cost * 10000) / 10000,
      events: data.events,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return Response.json({
    quota: {
      usedUsd: quota.usedUsd,
      budgetUsd: quota.budgetUsd,
      creditsUsd: quota.creditsUsd,
      effectiveBudgetUsd: quota.effectiveBudgetUsd,
      usedPct: quota.usedPct,
      status: quota.status,
      plan: quota.plan,
      canTopUp: quota.canTopUp,
    },
    currentMonth: monthStr,
    categories,
    monthlyHistory,
    creditPurchases: (creditsRes.data ?? []).map((c) => ({
      id: c.id,
      amountUsd: Number(c.amount_usd),
      priceUsd: Number(c.price_usd),
      month: c.month,
      createdAt: c.created_at,
    })),
  })
}
