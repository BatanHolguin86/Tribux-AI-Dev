'use client'

import { useEffect, useState, useCallback } from 'react'

type OverageEntry = {
  id: string
  user_id: string
  userEmail: string
  month: string
  plan: string
  budget_usd: number
  used_usd: number
  overage_usd: number
  overage_multiplier: number
  charge_usd: number
  stripe_invoice_item_id: string | null
  status: 'pending' | 'billed' | 'waived' | 'error'
  error_message: string | null
  billed_at: string | null
}

function fmt(v: number) {
  return `$${Number(v).toFixed(2)}`
}

function MonthPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
    />
  )
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  billed:  { label: 'Cobrado',   cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  waived:  { label: 'Eximido',   cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  error:   { label: 'Error',     cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

export function OverageLedgerTable() {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [month, setMonth] = useState(defaultMonth)
  const [entries, setEntries] = useState<OverageEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: string[] } | null>(null)

  const load = useCallback(async (m: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/finance/overage?month=${m}`)
      if (res.ok) setEntries(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(month) }, [month, load])

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/admin/finance/overage/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      })
      const data = await res.json()
      setSyncResult({ synced: data.synced ?? 0, errors: data.errors ?? [] })
      await load(month)
    } finally {
      setSyncing(false)
    }
  }

  async function handleBill(id: string) {
    if (!confirm('¿Crear Stripe Invoice Item para este overage? El usuario será cobrado en su próxima factura.')) return
    setActioning(id)
    try {
      await fetch(`/api/admin/finance/overage/${id}/bill`, { method: 'POST' })
      await load(month)
    } finally {
      setActioning(null)
    }
  }

  async function handleWaive(id: string) {
    if (!confirm('¿Eximir este overage? No se cobrará al usuario.')) return
    setActioning(id)
    try {
      await fetch(`/api/admin/finance/overage/${id}/waive`, { method: 'POST' })
      await load(month)
    } finally {
      setActioning(null)
    }
  }

  const totalCharge = entries
    .filter((e) => e.status === 'pending' || e.status === 'billed')
    .reduce((s, e) => s + Number(e.charge_usd), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Overage Billing
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Usuarios que superaron su presupuesto mensual de IA. Cobro 1.5× del exceso vía Stripe.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-md bg-[#0F2B46] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0A1F33] disabled:opacity-50"
          >
            {syncing ? 'Calculando...' : 'Sincronizar mes'}
          </button>
        </div>
      </div>

      {/* Sync result */}
      {syncResult && (
        <div className={`rounded-md px-4 py-2.5 text-sm ${syncResult.errors.length > 0 ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'}`}>
          {syncResult.errors.length === 0
            ? `Sincronizados ${syncResult.synced} usuario(s) con overage en ${month}.`
            : `${syncResult.synced} sincronizados, ${syncResult.errors.length} errores: ${syncResult.errors.join('; ')}`}
        </div>
      )}

      {/* Summary */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Entradas', value: String(entries.length) },
            { label: 'Cargo total', value: fmt(totalCharge) },
            { label: 'Pendientes', value: String(entries.filter((e) => e.status === 'pending').length) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#0EA5A3]/30 border-t-[#0EA5A3]" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No hay overages para {month}. Haz click en &quot;Sincronizar mes&quot; para calcular.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Usuario', 'Plan', 'Budget', 'Usado', 'Overage', 'Cargo (1.5×)', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {entries.map((e) => {
                const sc = STATUS_CONFIG[e.status]
                const busy = actioning === e.id
                return (
                  <tr key={e.id} className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{e.userEmail}</div>
                      <div className="text-xs text-gray-400">{e.user_id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#E8F4F8] px-2 py-0.5 text-xs font-medium capitalize text-[#0F2B46] dark:bg-[#0F2B46]/30 dark:text-[#0EA5A3]">
                        {e.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">{fmt(e.budget_usd)}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-900 dark:text-white font-medium">{fmt(e.used_usd)}</td>
                    <td className="px-4 py-3 tabular-nums text-orange-600 dark:text-orange-400 font-medium">{fmt(e.overage_usd)}</td>
                    <td className="px-4 py-3 tabular-nums text-red-600 dark:text-red-400 font-bold">{fmt(e.charge_usd)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc.cls}`}>
                        {sc.label}
                      </span>
                      {e.error_message && (
                        <p className="mt-0.5 text-xs text-red-500">{e.error_message}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {e.status === 'pending' || e.status === 'error' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBill(e.id)}
                            disabled={busy}
                            className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {busy ? '...' : 'Cobrar'}
                          </button>
                          <button
                            onClick={() => handleWaive(e.id)}
                            disabled={busy}
                            className="rounded bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
                          >
                            Eximir
                          </button>
                        </div>
                      ) : e.status === 'billed' && e.stripe_invoice_item_id ? (
                        <span className="text-xs text-gray-400">{e.stripe_invoice_item_id.slice(0, 12)}…</span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
