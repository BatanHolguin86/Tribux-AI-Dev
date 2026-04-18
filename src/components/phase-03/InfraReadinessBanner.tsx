'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ServiceStatus = 'connected' | 'partial' | 'missing' | 'error'
type InfraService = { id: string; status: ServiceStatus; details: Record<string, unknown> }

const CORE_SERVICES = ['github', 'supabase', 'vercel', 'anthropic'] as const

const SERVICE_LABELS: Record<string, string> = {
  github: 'GitHub',
  supabase: 'Supabase',
  vercel: 'Vercel',
  anthropic: 'AI (Anthropic)',
}

const STATUS_ICON: Record<ServiceStatus, { icon: string; cls: string }> = {
  connected: { icon: '✓', cls: 'text-green-600 dark:text-green-400' },
  partial:   { icon: '!', cls: 'text-yellow-600 dark:text-yellow-400' },
  missing:   { icon: '✗', cls: 'text-red-500 dark:text-red-400' },
  error:     { icon: '✗', cls: 'text-red-500 dark:text-red-400' },
}

export function InfraReadinessBanner({ projectId }: { projectId: string }) {
  const [services, setServices] = useState<InfraService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/infrastructure`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.services) setServices(data.services)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) return null

  const core = services.filter((s) => (CORE_SERVICES as readonly string[]).includes(s.id))
  if (core.length === 0) return null

  const connectedCount = core.filter((s) => s.status === 'connected').length
  const allConnected = connectedCount === core.length

  return (
    <div
      className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
        allConnected
          ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
          : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Infraestructura {connectedCount}/{core.length}
        </span>
        <div className="flex items-center gap-3">
          {core.map((s) => {
            const icon = STATUS_ICON[s.status]
            return (
              <span key={s.id} className="flex items-center gap-1">
                <span className={`text-xs font-bold ${icon.cls}`}>{icon.icon}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {SERVICE_LABELS[s.id] ?? s.id}
                </span>
              </span>
            )
          })}
        </div>
      </div>
      <Link
        href={`/projects/${projectId}/infrastructure`}
        className="shrink-0 text-xs font-medium text-brand-primary underline hover:text-brand-primary dark:text-brand-teal"
      >
        Configurar →
      </Link>
    </div>
  )
}
