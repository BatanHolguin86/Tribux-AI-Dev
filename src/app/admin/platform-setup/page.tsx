import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlatformSetupWizard } from '@/components/admin/PlatformSetupWizard'

export default async function PlatformSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin' && profile?.role !== 'financial_admin') redirect('/admin/login')

  return <PlatformSetupWizard />
}
