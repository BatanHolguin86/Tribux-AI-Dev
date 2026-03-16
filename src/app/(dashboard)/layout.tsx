import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TrialBanner } from '@/components/shared/TrialBanner'
import { getTrialDaysRemaining } from '@/lib/plans/guards'

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
    .select('onboarding_completed, full_name, subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  const displayName = profile.full_name || user.email?.split('@')[0] || 'Usuario'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/dashboard" className="text-lg font-bold text-violet-600">
            AI Squad
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{displayName}</span>
            <Link
              href="/settings"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cuenta
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <TrialBanner
          daysRemaining={getTrialDaysRemaining(profile.trial_ends_at)}
          subscriptionStatus={profile.subscription_status ?? 'free'}
        />
        {children}
      </main>
    </div>
  )
}
