import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FinanceOverviewTable } from '@/components/admin/FinanceOverviewTable'
import { OverageLedgerTable } from '@/components/admin/OverageLedgerTable'

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Control financiero
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Costos de IA e infraestructura, ingresos y margen por usuario.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-violet-500/30 border-t-violet-500" />
          </div>
        }
      >
        <FinanceOverviewTable />
      </Suspense>

      <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
        <OverageLedgerTable />
      </div>
    </div>
  )
}
