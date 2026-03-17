'use client'

import { useEffect, useState } from 'react'

type UserDetail = {
  userId: string
  fullName: string | null
  plan: string
  subscriptionStatus: string
  trialEndsAt: string | null
  createdAt: string
  role: string
  planPriceUsd: number
}

type DetailResponse = {
  user: UserDetail
  totalCostAllTimeUsd: number
  monthlyBreakdown: Array<{
    month: string
    costUsd: number
    inputTokens: number
    outputTokens: number
    events: number
  }>
  eventTypeBreakdown: Array<{
    eventType: string
    costUsd: number
    inputTokens: number
    outputTokens: number
    count: number
  }>
  recentEvents: Array<{
    id: string
    projectId: string | null
    eventType: string
    model: string | null
    inputTokens: number
    outputTokens: number
    estimatedCostUsd: number
    createdAt: string
  }>
}

export function UserFinanceDetail({ userId }: { userId: string }) {
  const [data, setData] = useState<DetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/finance/users/${encodeURIComponent(userId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Usuario no encontrado' : 'Error al cargar')
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3 text-red-700 dark:text-red-300">
        {error}
      </div>
    )
  }

  if (loading || !data) {
    return <div className="text-gray-500 dark:text-gray-400">Cargando detalle…</div>
  }

  const { user, totalCostAllTimeUsd, monthlyBreakdown, eventTypeBreakdown, recentEvents } = data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {user.fullName || 'Usuario'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          ID: {user.userId} · Plan: {user.plan} · Estado: {user.subscriptionStatus}
          {user.planPriceUsd > 0 && ` · Precio: $${user.planPriceUsd}/mes`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Coste IA total (histórico)</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            ${totalCostAllTimeUsd.toFixed(2)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Coste por mes
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Mes</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Coste (USD)</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Tokens in</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Tokens out</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Eventos</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBreakdown.map((row) => (
                <tr
                  key={row.month}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{row.month}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">${row.costUsd.toFixed(2)}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {row.inputTokens.toLocaleString()}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {row.outputTokens.toLocaleString()}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{row.events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Coste por tipo de evento
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Tipo</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Coste (USD)</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Llamadas</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Tokens in</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Tokens out</th>
              </tr>
            </thead>
            <tbody>
              {eventTypeBreakdown.map((row) => (
                <tr
                  key={row.eventType}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                    {row.eventType}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">${row.costUsd.toFixed(2)}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{row.count}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {row.inputTokens.toLocaleString()}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {row.outputTokens.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Últimos eventos (hasta 100)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Fecha</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Tipo</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Modelo</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">In / Out</th>
                <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Coste</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-gray-900 dark:text-gray-100">{e.eventType}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{e.model ?? '—'}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {e.inputTokens.toLocaleString()} / {e.outputTokens.toLocaleString()}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">
                    ${Number(e.estimatedCostUsd).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
