import type { Plan, SubscriptionStatus } from '@/types/user'

const PLAN_HIERARCHY: Record<Plan, number> = {
  starter: 0,
  builder: 1,
  pro: 2,
  agency: 3,
  enterprise: 4,
}

const PLAN_TRIAL_DAYS = parseInt(process.env.PLAN_TRIAL_DAYS ?? '7', 10)
const PLAN_FREE_PHASE_01_FEATURES = parseInt(process.env.PLAN_FREE_PHASE_01_FEATURES ?? '1', 10)
const PLAN_FREE_AGENTS = (process.env.PLAN_FREE_AGENTS ?? 'cto_only').split(',')

type PlanStatus = {
  plan: Plan
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: string | null
  isTrialActive: boolean
  isFree: boolean
  isPaid: boolean
  trialDaysRemaining: number
}

export function getUserPlanStatus(profile: {
  plan: Plan
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
}): PlanStatus {
  const trialActive = isTrialActive(profile.trial_ends_at, profile.subscription_status)
  const isPaid = profile.subscription_status === 'active'
  const isFree = !trialActive && !isPaid

  return {
    plan: profile.plan,
    subscriptionStatus: profile.subscription_status,
    trialEndsAt: profile.trial_ends_at,
    isTrialActive: trialActive,
    isFree,
    isPaid,
    trialDaysRemaining: getTrialDaysRemaining(profile.trial_ends_at),
  }
}

export function isTrialActive(
  trialEndsAt: string | null,
  subscriptionStatus: SubscriptionStatus,
): boolean {
  if (subscriptionStatus !== 'trialing') return false
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) > new Date()
}

export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Phase 00 + Phase 01 (1 feature) are always free.
 * Phase 02+ requires trial or paid plan.
 */
export function canAccessPhase(
  phaseNumber: number,
  profile: {
    plan: Plan
    subscription_status: SubscriptionStatus
    trial_ends_at: string | null
  },
): boolean {
  // Phase 00 and 01 are always accessible for any plan
  if (phaseNumber <= 1) return true

  const status = getUserPlanStatus(profile)

  // Trial users can access all phases
  if (status.isTrialActive) return true

  // Paid users: access depends on plan tier
  if (status.isPaid) {
    // Starter ($49): phases 00-02 only (discovery + specs + architecture)
    if (profile.plan === 'starter') return phaseNumber <= 2

    // Builder ($149)+: all phases
    return true
  }

  return false
}

/**
 * Free users: max 1 feature in Phase 01.
 * Trial/paid: unlimited.
 */
export function canCreateFeatureInPhase01(
  currentFeatureCount: number,
  profile: {
    plan: Plan
    subscription_status: SubscriptionStatus
    trial_ends_at: string | null
  },
): boolean {
  const status = getUserPlanStatus(profile)

  if (status.isTrialActive || status.isPaid) return true

  return currentFeatureCount < PLAN_FREE_PHASE_01_FEATURES
}

/**
 * Free users: only CTO Virtual.
 * Trial/paid: all agents per plan hierarchy.
 */
export function canUseAgent(
  agentType: string,
  agentPlanRequired: Plan,
  profile: {
    plan: Plan
    subscription_status: SubscriptionStatus
    trial_ends_at: string | null
  },
): boolean {
  const status = getUserPlanStatus(profile)

  // Paid users follow plan hierarchy
  if (status.isPaid) {
    return PLAN_HIERARCHY[profile.plan] >= PLAN_HIERARCHY[agentPlanRequired]
  }

  // Trial users get full access
  if (status.isTrialActive) return true

  // Free users: only CTO
  if (PLAN_FREE_AGENTS.includes('cto_only') && agentType === 'cto_virtual') {
    return true
  }

  return false
}

/**
 * Free users: 1 project.
 * Starter: 1 project. Builder: 3. Agency: 10. Enterprise: unlimited.
 */
export function canCreateProject(
  currentProjectCount: number,
  profile: {
    plan: Plan
    subscription_status: SubscriptionStatus
    trial_ends_at: string | null
  },
): boolean {
  const status = getUserPlanStatus(profile)
  const limits: Record<Plan, number> = {
    starter: 1,
    builder: 1,
    pro: 3,
    agency: 10,
    enterprise: Infinity,
  }

  // Free users after trial: 1 project
  if (status.isFree) {
    return currentProjectCount < 1
  }

  // Trial users: same as starter
  if (status.isTrialActive) {
    return currentProjectCount < limits.starter
  }

  return currentProjectCount < limits[profile.plan]
}
