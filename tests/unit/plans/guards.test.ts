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

const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()

const trialingProfile = {
  plan: 'starter' as const,
  subscription_status: 'trialing' as const,
  trial_ends_at: futureDate,
}

const freeProfile = {
  plan: 'starter' as const,
  subscription_status: 'free' as const,
  trial_ends_at: pastDate,
}

const paidProfile = {
  plan: 'builder' as const,
  subscription_status: 'active' as const,
  trial_ends_at: null,
}

const expiredTrialProfile = {
  plan: 'starter' as const,
  subscription_status: 'trialing' as const,
  trial_ends_at: pastDate,
}

describe('isTrialActive', () => {
  it('returns true when trialing and trial not expired', () => {
    expect(isTrialActive(futureDate, 'trialing')).toBe(true)
  })

  it('returns false when trialing but trial expired', () => {
    expect(isTrialActive(pastDate, 'trialing')).toBe(false)
  })

  it('returns false when not trialing status', () => {
    expect(isTrialActive(futureDate, 'active')).toBe(false)
    expect(isTrialActive(futureDate, 'free')).toBe(false)
  })

  it('returns false when trial_ends_at is null', () => {
    expect(isTrialActive(null, 'trialing')).toBe(false)
  })
})

describe('getTrialDaysRemaining', () => {
  it('returns positive days for future date', () => {
    const days = getTrialDaysRemaining(futureDate)
    expect(days).toBeGreaterThan(0)
    expect(days).toBeLessThanOrEqual(5)
  })

  it('returns 0 for past date', () => {
    expect(getTrialDaysRemaining(pastDate)).toBe(0)
  })

  it('returns 0 for null', () => {
    expect(getTrialDaysRemaining(null)).toBe(0)
  })
})

describe('getUserPlanStatus', () => {
  it('returns trial active status for trialing user', () => {
    const status = getUserPlanStatus(trialingProfile)
    expect(status.isTrialActive).toBe(true)
    expect(status.isFree).toBe(false)
    expect(status.isPaid).toBe(false)
    expect(status.trialDaysRemaining).toBeGreaterThan(0)
  })

  it('returns free status for expired trial user', () => {
    const status = getUserPlanStatus(expiredTrialProfile)
    expect(status.isTrialActive).toBe(false)
    expect(status.isFree).toBe(true)
    expect(status.isPaid).toBe(false)
  })

  it('returns paid status for active subscriber', () => {
    const status = getUserPlanStatus(paidProfile)
    expect(status.isPaid).toBe(true)
    expect(status.isFree).toBe(false)
    expect(status.isTrialActive).toBe(false)
  })
})

describe('canAccessPhase', () => {
  it('allows Phase 00 and 01 for all users', () => {
    expect(canAccessPhase(0, freeProfile)).toBe(true)
    expect(canAccessPhase(1, freeProfile)).toBe(true)
    expect(canAccessPhase(0, trialingProfile)).toBe(true)
    expect(canAccessPhase(1, paidProfile)).toBe(true)
  })

  // guards.ts has TEMPORARY unlock (return true) for Phase 02+ — tests match until removed
  it('TEMPORARY: allows Phase 02+ for all profiles (production testing bypass)', () => {
    expect(canAccessPhase(2, freeProfile)).toBe(true)
    expect(canAccessPhase(7, freeProfile)).toBe(true)
    expect(canAccessPhase(2, trialingProfile)).toBe(true)
    expect(canAccessPhase(7, trialingProfile)).toBe(true)
    expect(canAccessPhase(2, paidProfile)).toBe(true)
    expect(canAccessPhase(2, expiredTrialProfile)).toBe(true)
  })
})

describe('canCreateFeatureInPhase01', () => {
  it('allows first feature for free users', () => {
    expect(canCreateFeatureInPhase01(0, freeProfile)).toBe(true)
  })

  it('blocks second feature for free users', () => {
    expect(canCreateFeatureInPhase01(1, freeProfile)).toBe(false)
  })

  it('allows unlimited features for trial users', () => {
    expect(canCreateFeatureInPhase01(5, trialingProfile)).toBe(true)
  })

  it('allows unlimited features for paid users', () => {
    expect(canCreateFeatureInPhase01(10, paidProfile)).toBe(true)
  })
})

describe('canUseAgent', () => {
  it('allows CTO for free users', () => {
    expect(canUseAgent('cto_virtual', 'starter', freeProfile)).toBe(true)
  })

  it('blocks non-CTO agents for free users', () => {
    expect(canUseAgent('product_architect', 'builder', freeProfile)).toBe(false)
    expect(canUseAgent('ui_ux_designer', 'builder', freeProfile)).toBe(false)
  })

  it('allows all agents for trial users', () => {
    expect(canUseAgent('product_architect', 'builder', trialingProfile)).toBe(true)
    expect(canUseAgent('operator', 'agency', trialingProfile)).toBe(true)
  })

  it('respects plan hierarchy for paid users', () => {
    expect(canUseAgent('cto_virtual', 'starter', paidProfile)).toBe(true)
    expect(canUseAgent('product_architect', 'builder', paidProfile)).toBe(true)
    expect(canUseAgent('operator', 'agency', paidProfile)).toBe(false)
  })
})

describe('canCreateProject', () => {
  it('allows first project for free users', () => {
    expect(canCreateProject(0, freeProfile)).toBe(true)
  })

  it('blocks second project for free users', () => {
    expect(canCreateProject(1, freeProfile)).toBe(false)
  })

  it('follows plan limits for paid users', () => {
    const agencyProfile = {
      plan: 'agency' as const,
      subscription_status: 'active' as const,
      trial_ends_at: null,
    }
    expect(canCreateProject(5, agencyProfile)).toBe(true)
    expect(canCreateProject(10, agencyProfile)).toBe(false)
  })
})
