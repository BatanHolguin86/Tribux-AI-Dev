'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type UserRow = {
  userId: string
  fullName: string | null
  plan: string
  subscriptionStatus: string
  trialEndsAt: string | null
  createdAt: string
  role: string
  costCurrentMonthUsd: number
  costPreviousMonthUsd: number
  planPriceUsd: number
  marginRatio: number
  inputTokensCurrentMonth: number
  outputTokensCurrentMonth: number
}

type OverviewResponse = {
  summary: {
    totalUsers: number
    totalCostCurrentMonthUsd: number
    totalCostPreviousMonthUsd: number
    totalRevenueCurrentMonthUsd: number
  }
  users: UserRow[]
}

export function FinanceOverviewTable() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState<string>('')

  useEffect(() => {
    const params = month ? `?month=${encodeURIComponent(month)}` : ''
    fetch(`/api/admin/finance/overview${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? 'Acceso denegado' : 'Error al cargar')
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [month])

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3 text-red-700 dark:text-red-300">
        {error}
      </div>
    )
  }

  if (loading || !data) {
    return <div className="text-gray-500 dark:text-gray-400">Cargando resumen…</div>
  }

  const { summary, users } = data
  const now = new Date()
  const currentMonthLabel = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          Mes:
          <input
            type="month"
            value={month || currentMonthLabel}
            onChange={(e) => setMonth(e.target.value || '')}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Usuarios</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.totalUsers}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Coste IA (mes)</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            ${summary.totalCostCurrentMonthUsd.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Coste IA (mes anterior)</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            ${summary.totalCostPreviousMonthUsd.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos (activos + trial)</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            ${summary.totalRevenueCurrentMonthUsd.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Usuario</th>
              <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Plan</th>
              <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Estado</th>
              <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Coste IA (mes)</th>
              <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Precio plan</th>
              <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Margen</th>
              <th className="p-3 font-medium text-gray-900 dark:text-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.userId}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="p-3">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {u.fullName || '—'}
                  </span>
                  <span className="ml-1 block text-xs text-gray-400 dark:text-gray-500">
                    {u.userId.slice(0, 8)}…
                  </span>
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{u.plan}</td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{u.subscriptionStatus}</td>
                <td className="p-3">
                  <span className="text-gray-900 dark:text-gray-100">
                    ${u.costCurrentMonthUsd.toFixed(2)}
                  </span>
                  <span className="ml-1 text-xs text-gray-500">
                    ({u.inputTokensCurrentMonth.toLocaleString()} in / {u.outputTokensCurrentMonth.toLocaleString()} out)
                  </span>
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-300">
                  {u.planPriceUsd > 0 ? `$${u.planPriceUsd}` : 'Custom'}
                </td>
                <td className="p-3">
                  <span
                    className={
                      u.marginRatio >= 0.6
                        ? 'text-green-600 dark:text-green-400'
                        : u.marginRatio >= 0.3
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {u.planPriceUsd > 0 ? `${(u.marginRatio * 100).toFixed(0)}%` : '—'}
                  </span>
                </td>
                <td className="p-3">
                  <Link
                    href={`/admin/finance/users/${u.userId}`}
                    className="font-medium text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
