import { Suspense } from 'react'
import Link from 'next/link'
import { UserFinanceDetail } from '@/components/admin/UserFinanceDetail'

export default async function AdminFinanceUserPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/finance"
          className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Resumen
        </Link>
      </div>
      <Suspense fallback={<div className="text-gray-500">Cargando…</div>}>
        <UserFinanceDetail userId={userId} />
      </Suspense>
    </div>
  )
}
