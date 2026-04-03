import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserFinanceDetail } from '@/components/admin/UserFinanceDetail'

export default async function AdminFinanceUserPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'financial_admin' && profile.role !== 'super_admin')) {
    redirect('/admin/login')
  }

  const { userId } = await params

  return (
    <div className="space-y-6">
      <Link
        href="/admin/finance"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F2B46] dark:text-[#0EA5A3] hover:text-[#0F2B46] dark:hover:text-[#0EA5A3] transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Volver al resumen
      </Link>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#0EA5A3]/30 border-t-[#0EA5A3]" />
          </div>
        }
      >
        <UserFinanceDetail userId={userId} />
      </Suspense>
    </div>
  )
}
