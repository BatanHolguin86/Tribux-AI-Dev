import { describe, it, expect } from 'vitest'
import { buildExecutionPlan } from '@/lib/build/orchestrator'
import type { TaskWithFeature } from '@/types/task'

const makeTask = (overrides: Partial<TaskWithFeature> = {}): TaskWithFeature => ({
  id: 'task-1',
  project_id: 'proj-1',
  feature_id: 'feat-1',
  task_key: 'TASK-001',
  title: 'Create database schema',
  category: 'database',
  status: 'todo',
  display_order: 0,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  feature_name: 'Auth',
  ...overrides,
})

describe('buildExecutionPlan', () => {
  it('returns empty plan for no tasks', () => {
    const plan = buildExecutionPlan([])
    expect(plan.tiers).toHaveLength(0)
    expect(plan.totalTasks).toBe(0)
  })

  it('classifies database tasks to tier 0', () => {
    const plan = buildExecutionPlan([
      makeTask({ category: 'database', title: 'Create tables' }),
    ])
    expect(plan.tiers[0].tier).toBe(0)
  })

  it('classifies backend tasks to tier 1', () => {
    const plan = buildExecutionPlan([
      makeTask({ category: 'backend', title: 'Create API routes' }),
    ])
    expect(plan.tiers[0].tier).toBe(1)
  })

  it('classifies frontend tasks to tier 2', () => {
    const plan = buildExecutionPlan([
      makeTask({ category: 'frontend', title: 'Build dashboard UI' }),
    ])
    expect(plan.tiers[0].tier).toBe(2)
  })

  it('classifies test tasks to tier 3', () => {
    const plan = buildExecutionPlan([
      makeTask({ category: 'tests', title: 'Write unit tests' }),
    ])
    expect(plan.tiers[0].tier).toBe(3)
  })

  it('groups multiple tasks in same tier', () => {
    const plan = buildExecutionPlan([
      makeTask({ id: 't1', category: 'database', title: 'Create users table' }),
      makeTask({ id: 't2', category: 'database', title: 'Create projects table' }),
    ])
    expect(plan.tiers).toHaveLength(1)
    expect(plan.tiers[0].tasks).toHaveLength(2)
    expect(plan.tiers[0].parallel).toBe(true)
  })

  it('creates multiple tiers for different categories', () => {
    const plan = buildExecutionPlan([
      makeTask({ id: 't1', category: 'database', title: 'Schema' }),
      makeTask({ id: 't2', category: 'backend', title: 'API' }),
      makeTask({ id: 't3', category: 'frontend', title: 'UI' }),
    ])
    expect(plan.tiers.length).toBeGreaterThanOrEqual(3)
    expect(plan.totalTasks).toBe(3)
  })

  it('assigns correct agent by task keywords', () => {
    const plan = buildExecutionPlan([
      makeTask({ title: 'Create database migration for users table' }),
    ])
    const task = plan.tiers[0].tasks[0]
    expect(task.agent).toBe('db_admin')
  })

  it('assigns qa_engineer for test tasks', () => {
    const plan = buildExecutionPlan([
      makeTask({ title: 'Write unit tests for auth', category: 'tests' }),
    ])
    const task = plan.tiers[0].tasks[0]
    expect(task.agent).toBe('qa_engineer')
  })

  it('defaults to lead_developer for generic tasks', () => {
    const plan = buildExecutionPlan([
      makeTask({ title: 'Implement feature X', category: 'frontend' }),
    ])
    const task = plan.tiers[0].tasks[0]
    expect(task.agent).toBe('lead_developer')
  })
})
