export type Persona = 'founder' | 'pm' | 'consultor' | 'emprendedor'

export type Plan = 'starter' | 'builder' | 'agency' | 'enterprise'

export type UserProfile = {
  id: string
  full_name: string | null
  persona: Persona | null
  plan: Plan
  onboarding_completed: boolean
  onboarding_step: number
  created_at: string
  updated_at: string
}
