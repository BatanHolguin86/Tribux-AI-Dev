'use client'

import { useState, useEffect } from 'react'

type ProviderStatus = {
  provider: string
  is_connected: boolean
  has_token: boolean
  last_tested_at: string | null
  test_result: string | null
  metadata: Record<string, string>
  source?: 'db' | 'env' | 'none'
}

const PROVIDERS = [
  {
    id: 'github' as const,
    label: 'GitHub',
    step: 1,
    icon: '📦',
    description: 'Repositorios de codigo para los proyectos de tus usuarios.',
    tokenLabel: 'Personal Access Token',
    tokenPlaceholder: 'ghp_...',
    helpUrl: 'https://github.com/settings/tokens/new?scopes=repo,admin:org&description=AI+Squad+Platform',
    helpText: 'Crear token en GitHub →',
    metaFields: [{ key: 'org', label: 'Nombre de la org', placeholder: 'tribux-apps' }],
  },
  {
    id: 'supabase' as const,
    label: 'Supabase',
    step: 2,
    icon: '🗄️',
    description: 'Base de datos PostgreSQL para cada proyecto.',
    tokenLabel: 'Management API Token',
    tokenPlaceholder: 'sbp_...',
    helpUrl: 'https://supabase.com/dashboard/account/tokens',
    helpText: 'Obtener token en Supabase →',
    metaFields: [{ key: 'org_id', label: 'Organization ID', placeholder: 'org_...' }],
  },
  {
    id: 'vercel' as const,
    label: 'Vercel',
    step: 3,
    icon: '🚀',
    description: 'Hosting y deploy automatico para cada proyecto.',
    tokenLabel: 'API Token',
    tokenPlaceholder: '...',
    helpUrl: 'https://vercel.com/account/tokens',
    helpText: 'Crear token en Vercel →',
    metaFields: [{ key: 'team_id', label: 'Team ID (opcional)', placeholder: 'team_...' }],
  },
]

export function PlatformSetupWizard() {
  const [statuses, setStatuses] = useState<ProviderStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/platform-config')
      .then((r) => r.json())
      .then((data) => setStatuses(data.providers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const allConnected = PROVIDERS.every((p) =>
    statuses.find((s) => s.provider === p.id)?.is_connected,
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">
          Configuracion de Plataforma
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Conecta tus cuentas una sola vez. Todos tus usuarios podran crear infraestructura automaticamente.
        </p>
      </div>

      {allConnected && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
          ✅ Plataforma lista. Tus usuarios ya pueden crear apps con un clic.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
        </div>
      ) : (
        PROVIDERS.map((provider) => (
          <ProviderCard
            key={provider.id}
            config={provider}
            status={statuses.find((s) => s.provider === provider.id) ?? null}
            onUpdated={() => {
              fetch('/api/admin/platform-config')
                .then((r) => r.json())
                .then((data) => setStatuses(data.providers ?? []))
                .catch(() => {})
            }}
          />
        ))
      )}
    </div>
  )
}

function ProviderCard({
  config,
  status,
  onUpdated,
}: {
  config: (typeof PROVIDERS)[number]
  status: ProviderStatus | null
  onUpdated: () => void
}) {
  const [token, setToken] = useState('')
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const isConnected = status?.is_connected ?? false

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/platform-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.id, token }),
      })
      const data = await res.json()
      setTestResult({ ok: data.success, msg: data.details ?? data.error ?? '' })
    } catch {
      setTestResult({ ok: false, msg: 'Error de conexion' })
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/admin/platform-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.id, token, metadata }),
      })
      setToken('')
      onUpdated()
    } catch { /* */ } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    await fetch(`/api/admin/platform-config/${config.id}`, { method: 'DELETE' })
    onUpdated()
  }

  return (
    <div className={`rounded-xl border-2 p-5 transition-colors ${
      isConnected
        ? 'border-green-200 bg-green-50/30 dark:border-green-900/50 dark:bg-green-950/10'
        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Paso {config.step}: {config.label}
              </h2>
              {isConnected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Conectado{status?.source === 'env' ? ' (env var)' : ''}
                </span>
              )}
              {status?.source === 'env' && status.metadata && Object.keys(status.metadata).length > 0 && (
                <span className="text-[10px] text-gray-400">
                  {Object.entries(status.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
          </div>
        </div>
        {isConnected && status?.source !== 'env' && (
          <button
            onClick={handleDisconnect}
            className="text-xs text-red-500 underline hover:text-red-600"
          >
            Desconectar
          </button>
        )}
      </div>

      {!isConnected && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              {config.tokenLabel}
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={config.tokenPlaceholder}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {config.metaFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {field.label}
              </label>
              <input
                type="text"
                value={metadata[field.key] ?? ''}
                onChange={(e) => setMetadata((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          ))}

          <a
            href={config.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-brand-primary underline hover:text-brand-primary dark:text-brand-teal"
          >
            {config.helpText}
          </a>

          {testResult && (
            <div className={`rounded-md px-3 py-2 text-xs ${
              testResult.ok
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {testResult.ok ? '✓ ' : '✗ '}{testResult.msg}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={testing || !token.trim()}
              className="rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
            >
              {testing ? 'Probando...' : 'Probar conexion'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !token.trim()}
              className="rounded-md bg-brand-primary px-4 py-2 text-xs font-medium text-white hover:bg-brand-navy disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
