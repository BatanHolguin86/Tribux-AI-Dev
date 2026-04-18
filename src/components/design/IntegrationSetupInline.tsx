'use client'

import { useState } from 'react'

type IntegrationSetupInlineProps = {
  projectId: string
  provider: 'figma' | 'v0'
  isConnected: boolean
  onConnected: () => void
}

const PROVIDER_CONFIG = {
  figma: {
    label: 'Figma',
    field: 'figma_token',
    helpUrl: 'https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens',
    placeholder: 'figd_...',
  },
  v0: {
    label: 'V0',
    field: 'v0_api_key',
    helpUrl: 'https://v0.dev/settings',
    placeholder: 'v0_...',
  },
}

export function IntegrationSetupInline({
  projectId,
  provider,
  isConnected,
  onConnected,
}: IntegrationSetupInlineProps) {
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = PROVIDER_CONFIG[provider]

  if (isConnected) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Conectado
      </span>
    )
  }

  async function handleSave() {
    if (!token.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/integrations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [config.field]: token.trim() }),
      })
      if (res.ok) {
        onConnected()
        setToken('')
      } else {
        setError('No se pudo guardar')
      }
    } catch {
      setError('Error de conexion')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={config.placeholder}
          className="flex-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-[#0EA5A3] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          onClick={handleSave}
          disabled={saving || !token.trim()}
          className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-navy disabled:opacity-50"
        >
          {saving ? '...' : 'Conectar'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <a
        href={config.helpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-brand-primary underline dark:text-brand-teal"
      >
        Como obtener tu token de {config.label} →
      </a>
    </div>
  )
}
