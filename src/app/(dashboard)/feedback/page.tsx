import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FeedbackPageClient } from '@/components/shared/FeedbackPageClient'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <FeedbackPageClient />
}
