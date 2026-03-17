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
      <div className="flex items-center gap-4">
        <Link
          href="/admin/finance"
          className="text-sm font-medium text-gray-400 hover:text-gray-200"
        >
          ← Resumen
        </Link>
      </div>
      <Suspense fallback={<div className="text-gray-500">Cargando...</div>}>
        <UserFinanceDetail userId={userId} />
      </Suspense>
    </div>
  )
}
