import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrialBanner } from '@/components/shared/TrialBanner'
import { FounderModeProvider } from '@/hooks/useFounderMode'
import { UsageQuotaBanner } from '@/components/shared/UsageQuotaBanner'
import { getTrialDaysRemaining } from '@/lib/plans/guards'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { FeedbackButton } from '@/components/shared/FeedbackButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed, full_name, subscription_status, trial_ends_at, persona')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  const displayName = profile.full_name || user.email?.split('@')[0] || 'Usuario'
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#F8FAFC] dark:bg-[#0A1F33] md:h-screen md:flex-row">
      <SidebarNav displayName={displayName} email={user.email ?? undefined} initials={initials} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <FounderModeProvider persona={profile.persona ?? null}>
            <div className="mb-6">
              <UsageQuotaBanner />
              <TrialBanner
                daysRemaining={getTrialDaysRemaining(profile.trial_ends_at)}
                subscriptionStatus={profile.subscription_status ?? 'free'}
              />
            </div>
            {children}
            <FeedbackButton />
          </FounderModeProvider>
        </main>
      </div>
    </div>
  )
}
