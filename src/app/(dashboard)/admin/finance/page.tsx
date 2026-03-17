import { Suspense } from 'react'
import Link from 'next/link'
import { FinanceOverviewTable } from '@/components/admin/FinanceOverviewTable'

export default function AdminFinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Control financiero — Resumen por cliente
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Costes de IA por usuario y margen. Usa este panel para precios enterprise y seguimiento de costes.
        </p>
      </div>
      <Suspense fallback={<div className="text-gray-500">Cargando…</div>}>
        <FinanceOverviewTable />
      </Suspense>
    </div>
  )
}
