import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPlanStatus, getTrialDaysRemaining } from '@/lib/plans/guards'
import { BillingSection } from '@/components/settings/BillingSection'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { ConsumptionDashboard } from '@/components/settings/ConsumptionDashboard'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const params = await searchParams
  const billingStatus = typeof params.billing === 'string' ? params.billing : undefined
  const billingPlan = typeof params.plan === 'string' ? params.plan : undefined

  const planStatus = getUserPlanStatus(profile)
  const trialDaysRemaining = getTrialDaysRemaining(profile.trial_ends_at)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Configuracion</h1>
        <p className="mt-1 text-sm text-gray-500">Administra tu cuenta y plan de suscripcion.</p>
      </div>

      <ProfileSection
        fullName={profile.full_name ?? ''}
        email={user.email ?? ''}
        persona={profile.persona}
      />

      <ConsumptionDashboard />

      <BillingSection
        currentPlan={profile.plan}
        subscriptionStatus={profile.subscription_status}
        trialDaysRemaining={trialDaysRemaining}
        isTrialActive={planStatus.isTrialActive}
        isPaid={planStatus.isPaid}
        billingStatus={billingStatus}
        billingPlan={billingPlan}
        stripeCustomerId={profile.stripe_customer_id}
      />
    </div>
  )
}
