import { createClient, createAdminClient } from '@/lib/supabase/server'

// ── Event-type → display category mapping ────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {}
const CATEGORIES: Array<{ id: string; label: string; events: string[] }> = [
  {
    id: 'chat',
    label: 'Chat & Consultas',
    events: [
      'agent_chat', 'phase00_chat', 'phase01_chat', 'phase02_chat',
      'phase03_chat', 'phase04_chat', 'phase05_chat', 'phase06_chat', 'phase07_chat',
    ],
  },
  {
    id: 'code',
    label: 'Generación de código',
    events: [
      'action_scaffold_project', 'action_generate_task_code',
      'action_auto_build_task', 'action_analyze_task',
      'action_configure_auth', 'action_generate_env_template',
    ],
  },
  {
    id: 'tests',
    label: 'Tests & QA',
    events: [
      'action_generate_test_plan', 'action_generate_unit_tests',
      'action_generate_e2e_tests', 'action_generate_qa_report',
    ],
  },
  {
    id: 'data',
    label: 'DB & Schema',
    events: ['action_apply_db_schema'],
  },
  {
    id: 'docs',
    label: 'Docs & Specs',
    events: [
      'phase00_generate', 'phase01_generate', 'phase01_autodraft',
      'phase01_autodraft_specialist', 'phase02_generate',
      'design_generate', 'design_refine', 'thread_title', 'suggestions',
    ],
  },
  {
    id: 'deploy',
    label: 'Deploy & Ops',
    events: ['action_generate_ops_runbook'],
  },
  {
    id: 'growth',
    label: 'Growth & Analytics',
    events: [
      'action_generate_analysis_report', 'action_generate_backlog',
      'action_generate_retrospective',
    ],
  },
]

for (const cat of CATEGORIES) {
  for (const ev of cat.events) CATEGORY_MAP[ev] = cat.id
}

// ── Types ─────────────────────────────────────────────────────────────────────

type UsageEvent = {
  estimated_cost_usd: number
  event_type: string
  input_tokens: number
  output_tokens: number
  created_at: string
}

export type CostSummary = {
  aiCostAllTime: number
  aiCostThisMonth: number
  totalInputTokens: number
  totalOutputTokens: number
  totalEventCount: number
  plan: string
  planBudgetUsd: number
  planPriceUsd: number
  thisMonthAllProjects: Array<{ projectId: string; projectName: string; costUsd: number }>
  byCategory: Array<{
    id: string; label: string; calls: number
    inputTokens: number; outputTokens: number; costUsd: number; pct: number
  }>
  monthlyHistory: Array<{ month: string; aiCostUsd: number; eventCount: number }>
  infraTiers: Record<string, string>
  projectCreatedAt: string
  overage: { hasOverage: boolean; amountUsd: number; status: string; month: string } | null
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()
    const admin = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    // ── 1. Project (ownership + infra_tiers) ──────────────────────────────────
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, created_at, infra_tiers, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return Response.json({ error: 'not_found' }, { status: 404 })

    // ── 2. All AI events for this project (all time) ───────────────────────────
    const { data: projectEvents } = await admin
      .from('ai_usage_events')
      .select('estimated_cost_usd, event_type, input_tokens, output_tokens, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    const events: UsageEvent[] = projectEvents ?? []

    // ── 3. User plan + budget ─────────────────────────────────────────────────
    const { data: profile } = await admin
      .from('user_profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan = profile?.plan ?? 'starter'

    const { data: planTarget } = await admin
      .from('plan_cost_targets')
      .select('monthly_ai_budget_usd, plan_price_usd')
      .eq('plan', plan)
      .single()

    const planBudgetUsd = planTarget?.monthly_ai_budget_usd ?? 0
    const planPriceUsd = planTarget?.plan_price_usd ?? 0

    // ── 4. This month — all projects of user (for plan split view) ────────────
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthStart = `${monthStr}-01T00:00:00.000Z`
    const nextMonth = new Date(monthStart)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const monthEnd = nextMonth.toISOString()

    const { data: userProjects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id)

    const { data: allMonthEvents } = await admin
      .from('ai_usage_events')
      .select('project_id, estimated_cost_usd')
      .eq('user_id', user.id)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)

    const projectNames = Object.fromEntries((userProjects ?? []).map((p) => [p.id, p.name]))
    const byProjectThisMonth: Record<string, number> = {}
    for (const ev of allMonthEvents ?? []) {
      const pid = ev.project_id ?? '__no_project__'
      byProjectThisMonth[pid] = (byProjectThisMonth[pid] ?? 0) + ev.estimated_cost_usd
    }

    const thisMonthAllProjects = Object.entries(byProjectThisMonth)
      .filter(([pid]) => pid !== '__no_project__')
      .map(([pid, costUsd]) => ({ projectId: pid, projectName: projectNames[pid] ?? 'Proyecto', costUsd }))
      .sort((a, b) => b.costUsd - a.costUsd)

    // ── 5. Aggregate all-time metrics for this project ────────────────────────
    let aiCostAllTime = 0
    let totalInputTokens = 0
    let totalOutputTokens = 0

    const byCategoryMap: Record<string, { calls: number; inputTokens: number; outputTokens: number; costUsd: number }> = {}
    const monthlyMap: Record<string, { costUsd: number; count: number }> = {}

    for (const ev of events) {
      aiCostAllTime += ev.estimated_cost_usd
      totalInputTokens += ev.input_tokens
      totalOutputTokens += ev.output_tokens

      // Category
      const catId = CATEGORY_MAP[ev.event_type] ?? 'docs'
      if (!byCategoryMap[catId]) byCategoryMap[catId] = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 }
      byCategoryMap[catId].calls++
      byCategoryMap[catId].inputTokens += ev.input_tokens
      byCategoryMap[catId].outputTokens += ev.output_tokens
      byCategoryMap[catId].costUsd += ev.estimated_cost_usd

      // Monthly
      const month = ev.created_at.slice(0, 7)
      if (!monthlyMap[month]) monthlyMap[month] = { costUsd: 0, count: 0 }
      monthlyMap[month].costUsd += ev.estimated_cost_usd
      monthlyMap[month].count++
    }

    const aiCostThisMonth = monthlyMap[monthStr]?.costUsd ?? 0

    // Build category breakdown sorted by cost desc
    const byCategory = CATEGORIES
      .filter((cat) => byCategoryMap[cat.id])
      .map((cat) => {
        const d = byCategoryMap[cat.id]
        return {
          id: cat.id,
          label: cat.label,
          calls: d.calls,
          inputTokens: d.inputTokens,
          outputTokens: d.outputTokens,
          costUsd: d.costUsd,
          pct: aiCostAllTime > 0 ? Math.round((d.costUsd / aiCostAllTime) * 100) : 0,
        }
      })
      .sort((a, b) => b.costUsd - a.costUsd)

    // Monthly history (sorted asc)
    let cumulative = 0
    const monthlyHistory = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        cumulative += data.costUsd
        return { month, aiCostUsd: data.costUsd, eventCount: data.count }
      })

    // ── 6. Overage for current month ──────────────────────────────────────────
    const { data: ovEntry } = await admin
      .from('overage_ledger')
      .select('overage_usd, charge_usd, status, month')
      .eq('user_id', user.id)
      .eq('month', monthStr)
      .single()

    const overage = ovEntry
      ? {
          hasOverage: (ovEntry.overage_usd ?? 0) > 0,
          amountUsd: ovEntry.charge_usd ?? ovEntry.overage_usd ?? 0,
          status: ovEntry.status,
          month: ovEntry.month,
        }
      : null

    const summary: CostSummary = {
      aiCostAllTime: Math.round(aiCostAllTime * 10000) / 10000,
      aiCostThisMonth: Math.round(aiCostThisMonth * 10000) / 10000,
      totalInputTokens,
      totalOutputTokens,
      totalEventCount: events.length,
      plan,
      planBudgetUsd,
      planPriceUsd,
      thisMonthAllProjects,
      byCategory,
      monthlyHistory,
      infraTiers: (project.infra_tiers ?? {}) as Record<string, string>,
      projectCreatedAt: project.created_at,
      overage,
    }

    return Response.json(summary)
  } catch (error) {
    console.error('[costs] Error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
