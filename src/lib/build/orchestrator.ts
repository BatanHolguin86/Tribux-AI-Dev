import type { TaskWithFeature } from '@/types/task'
import type { AgentType } from '@/types/agent'

/**
 * Execution tiers — tasks in the same tier can run in parallel.
 * Tiers execute sequentially: tier 0 completes before tier 1 starts.
 */
export type ExecutionPlan = {
  tiers: ExecutionTier[]
  totalTasks: number
}

export type ExecutionTier = {
  tier: number
  label: string
  tasks: PlannedTask[]
  parallel: boolean
}

export type PlannedTask = {
  task: TaskWithFeature
  agent: AgentType
  reason: string
}

// ── Category → Tier mapping ─────────────────────────────────────────────────

const CATEGORY_TIER: Record<string, number> = {
  setup: 0,
  database: 0,
  backend: 1,
  api: 1,
  frontend: 2,
  ui: 2,
  tests: 3,
  testing: 3,
  deploy: 4,
}

const TIER_LABELS: Record<number, string> = {
  0: 'Infraestructura & Base de datos',
  1: 'Backend & APIs',
  2: 'Frontend & UI',
  3: 'Tests',
  4: 'Deploy & Config',
}

// ── Agent routing based on task content ─────────────────────────────────────

const DB_KEYWORDS = ['tabla', 'table', 'migration', 'schema', 'rls', 'index', 'sql', 'database', 'columna', 'column']
const TEST_KEYWORDS = ['test', 'e2e', 'playwright', 'vitest', 'unit test', 'integration test', 'qa']
const DEVOPS_KEYWORDS = ['ci', 'cd', 'deploy', 'workflow', 'github actions', 'vercel', 'env var', 'monitoring']

function classifyAgent(task: TaskWithFeature): { agent: AgentType; reason: string } {
  const text = `${task.title} ${task.category ?? ''}`.toLowerCase()

  if (DB_KEYWORDS.some((kw) => text.includes(kw))) {
    return { agent: 'db_admin', reason: 'Task involucra base de datos' }
  }

  if (TEST_KEYWORDS.some((kw) => text.includes(kw))) {
    return { agent: 'qa_engineer', reason: 'Task involucra testing' }
  }

  if (DEVOPS_KEYWORDS.some((kw) => text.includes(kw))) {
    return { agent: 'devops_engineer', reason: 'Task involucra infraestructura' }
  }

  return { agent: 'lead_developer', reason: 'Implementacion general' }
}

function classifyTier(task: TaskWithFeature): number {
  const category = (task.category ?? '').toLowerCase()
  const title = task.title.toLowerCase()

  // Check category first
  for (const [key, tier] of Object.entries(CATEGORY_TIER)) {
    if (category.includes(key)) return tier
  }

  // Fallback: infer from title
  if (DB_KEYWORDS.some((kw) => title.includes(kw))) return 0
  if (title.includes('api') || title.includes('endpoint') || title.includes('route')) return 1
  if (title.includes('component') || title.includes('page') || title.includes('ui')) return 2
  if (TEST_KEYWORDS.some((kw) => title.includes(kw))) return 3
  if (DEVOPS_KEYWORDS.some((kw) => title.includes(kw))) return 4

  // Default to backend tier
  return 1
}

// ── Build the execution plan ────────────────────────────────────────────────

export function buildExecutionPlan(tasks: TaskWithFeature[]): ExecutionPlan {
  // Classify each task
  const classified = tasks.map((task) => ({
    task,
    tier: classifyTier(task),
    ...classifyAgent(task),
  }))

  // Group by tier
  const tierMap = new Map<number, PlannedTask[]>()
  for (const item of classified) {
    const existing = tierMap.get(item.tier) ?? []
    existing.push({ task: item.task, agent: item.agent, reason: item.reason })
    tierMap.set(item.tier, existing)
  }

  // Sort tiers and build plan
  const sortedTiers = Array.from(tierMap.entries()).sort(([a], [b]) => a - b)

  const tiers: ExecutionTier[] = sortedTiers.map(([tier, plannedTasks]) => ({
    tier,
    label: TIER_LABELS[tier] ?? `Tier ${tier}`,
    tasks: plannedTasks.sort((a, b) => a.task.display_order - b.task.display_order),
    parallel: plannedTasks.length > 1,
  }))

  return { tiers, totalTasks: tasks.length }
}
