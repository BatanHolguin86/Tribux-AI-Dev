import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FinanceOverviewTable } from '@/components/admin/FinanceOverviewTable'

export default async function AdminFinancePage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">
          Control financiero — Resumen por cliente
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Costes de IA por usuario y margen. Usa este panel para precios enterprise y seguimiento de costes.
        </p>
      </div>
      <Suspense fallback={<div className="text-gray-500">Cargando...</div>}>
        <FinanceOverviewTable />
      </Suspense>
    </div>
  )
}
