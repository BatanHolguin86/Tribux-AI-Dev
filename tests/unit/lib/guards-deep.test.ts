import { describe, it, expect } from 'vitest'
import {
  getUserPlanStatus,
  isTrialActive,
  getTrialDaysRemaining,
  canAccessPhase,
  canCreateFeatureInPhase01,
  canUseAgent,
  canCreateProject,
} from '@/lib/plans/guards'

const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
const past = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()

describe('canAccessPhase with new pricing tiers', () => {
  it('starter can access phases 0-2 only', () => {
    const p = { plan: 'starter' as const, subscription_status: 'active' as const, trial_ends_at: null }
    expect(canAccessPhase(0, p)).toBe(true)
    expect(canAccessPhase(1, p)).toBe(true)
    expect(canAccessPhase(2, p)).toBe(true)
    expect(canAccessPhase(3, p)).toBe(false)
    expect(canAccessPhase(4, p)).toBe(false)
    expect(canAccessPhase(7, p)).toBe(false)
  })

  it('builder can access all phases', () => {
    const p = { plan: 'builder' as const, subscription_status: 'active' as const, trial_ends_at: null }
    for (let i = 0; i <= 7; i++) {
      expect(canAccessPhase(i, p)).toBe(true)
    }
  })

  it('pro can access all phases', () => {
    const p = { plan: 'pro' as const, subscription_status: 'active' as const, trial_ends_at: null }
    for (let i = 0; i <= 7; i++) {
      expect(canAccessPhase(i, p)).toBe(true)
    }
  })

  it('agency can access all phases', () => {
    const p = { plan: 'agency' as const, subscription_status: 'active' as const, trial_ends_at: null }
    for (let i = 0; i <= 7; i++) {
      expect(canAccessPhase(i, p)).toBe(true)
    }
  })
})

describe('canCreateProject with new tiers', () => {
  it('starter: max 1 project', () => {
    const p = { plan: 'starter' as const, subscription_status: 'active' as const, trial_ends_at: null }
    expect(canCreateProject(0, p)).toBe(true)
    expect(canCreateProject(1, p)).toBe(false)
  })

  it('builder: max 1 project', () => {
    const p = { plan: 'builder' as const, subscription_status: 'active' as const, trial_ends_at: null }
    expect(canCreateProject(0, p)).toBe(true)
    expect(canCreateProject(1, p)).toBe(false)
  })

  it('pro: max 3 projects', () => {
    const p = { plan: 'pro' as const, subscription_status: 'active' as const, trial_ends_at: null }
    expect(canCreateProject(0, p)).toBe(true)
    expect(canCreateProject(2, p)).toBe(true)
    expect(canCreateProject(3, p)).toBe(false)
  })

  it('agency: max 10 projects', () => {
    const p = { plan: 'agency' as const, subscription_status: 'active' as const, trial_ends_at: null }
    expect(canCreateProject(9, p)).toBe(true)
    expect(canCreateProject(10, p)).toBe(false)
  })
})

describe('canUseAgent with starter tier', () => {
  it('starter paid user can access starter agents', () => {
    const p = { plan: 'starter' as const, subscription_status: 'active' as const, trial_ends_at: null }
    expect(canUseAgent('cto_virtual', 'starter', p)).toBe(true)
    expect(canUseAgent('product_architect', 'starter', p)).toBe(true)
    expect(canUseAgent('ui_ux_designer', 'starter', p)).toBe(true)
  })

  it('starter paid user cannot access builder agents', () => {
    const p = { plan: 'starter' as const, subscription_status: 'active' as const, trial_ends_at: null }
    expect(canUseAgent('lead_developer', 'builder', p)).toBe(false)
    expect(canUseAgent('db_admin', 'builder', p)).toBe(false)
  })

  it('builder paid user can access all agents', () => {
    const p = { plan: 'builder' as const, subscription_status: 'active' as const, trial_ends_at: null }
    expect(canUseAgent('cto_virtual', 'starter', p)).toBe(true)
    expect(canUseAgent('lead_developer', 'builder', p)).toBe(true)
    expect(canUseAgent('db_admin', 'builder', p)).toBe(true)
  })
})

describe('getUserPlanStatus edge cases', () => {
  it('expired trial with starter plan is free', () => {
    const status = getUserPlanStatus({ plan: 'starter', subscription_status: 'trialing', trial_ends_at: past })
    expect(status.isFree).toBe(true)
    expect(status.isTrialActive).toBe(false)
  })

  it('active subscription is paid', () => {
    const status = getUserPlanStatus({ plan: 'builder', subscription_status: 'active', trial_ends_at: null })
    expect(status.isPaid).toBe(true)
    expect(status.isFree).toBe(false)
  })

  it('canceled subscription is free', () => {
    const status = getUserPlanStatus({ plan: 'starter', subscription_status: 'canceled', trial_ends_at: null })
    expect(status.isFree).toBe(true)
  })
})

describe('getTrialDaysRemaining', () => {
  it('returns positive days for future trial', () => {
    const days = getTrialDaysRemaining(future)
    expect(days).toBeGreaterThan(0)
  })

  it('returns 0 for expired trial', () => {
    const days = getTrialDaysRemaining(past)
    expect(days).toBe(0)
  })

  it('returns 0 for null', () => {
    expect(getTrialDaysRemaining(null)).toBe(0)
  })
})
