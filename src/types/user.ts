export type Persona = 'founder' | 'pm' | 'consultor' | 'emprendedor'

export type Plan = 'starter' | 'builder' | 'agency' | 'enterprise'

export type SubscriptionStatus = 'trialing' | 'active' | 'free' | 'canceled' | 'past_due'

export type UserRole = 'user' | 'financial_admin' | 'super_admin'

export type UserProfile = {
  id: string
  full_name: string | null
  persona: Persona | null
  plan: Plan
  trial_ends_at: string | null
  subscription_status: SubscriptionStatus
  onboarding_completed: boolean
  onboarding_step: number
  stripe_customer_id: string | null
  role: UserRole
  created_at: string
  updated_at: string
}
