'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ServiceStatus = 'connected' | 'partial' | 'missing' | 'error'

type InfraService = {
  id: string
  status: ServiceStatus
  details: Record<string, unknown>
}

// ── Service metadata ────────────────────────────────────────────────────────

type ServiceMeta = {
  label: string
  description: string
  icon: React.ReactNode
  phases: string[]
  optional?: boolean
  docsUrl?: string
  settingsHint?: string
}

const SERVICE_META: Record<string, ServiceMeta> = {
  github: {
    label: 'GitHub',
    description: 'Repositorio de código, commits y CI/CD',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    phases: ['03', '04', '05', '06'],
    settingsHint: 'Configura el repo_url en la edición del proyecto',
  },
  supabase: {
    label: 'Supabase',
    description: 'Base de datos PostgreSQL, autenticación y migraciones',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C.33 12.593.722 13.39 1.408 13.39h9.378a.76.76 0 01.758.758L11.9 1.036zM12.1 22.964c.015.987 1.26 1.41 1.875.637l9.261-11.652c.434-.543.042-1.34-.644-1.34h-9.378a.76.76 0 01-.758-.758l-.356 13.113z" />
      </svg>
    ),
    phases: ['03', '06'],
    settingsHint: 'Configura supabase_project_ref y supabase_access_token en el proyecto',
  },
  github_actions: {
    label: 'GitHub Actions CI',
    description: 'Pipeline de integración continua (ci.yml)',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
      </svg>
    ),
    phases: ['05'],
    settingsHint: 'Ejecuta "Configurar CI" en Phase 05 para generar ci.yml',
  },
  vercel: {
    label: 'Vercel',
    description: 'Deploy de producción y previews automáticos',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M24 22.525H0l12-21.05 12 21.05z" />
      </svg>
    ),
    phases: ['06'],
    settingsHint: 'Ejecuta "Configurar deploy" en Phase 06 y conecta Vercel a GitHub',
  },
  anthropic: {
    label: 'Anthropic AI',
    description: 'Motor de generación de código, análisis y chat',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-3.654 0H6.57L0 20h3.603l6.57-16.48z" />
      </svg>
    ),
    phases: ['03', '04', '05', '06', '07'],
    settingsHint: 'Configura ANTHROPIC_API_KEY en las variables de entorno del servidor',
  },
  sentry: {
    label: 'Sentry',
    description: 'Monitoreo de errores y alertas en producción',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M14.12 1.062a1.56 1.56 0 00-2.702 0L.183 20.947A1.56 1.56 0 001.534 23.2h4.009a13.044 13.044 0 01-.576-2.42H3.3l9.12-16.294 5.35 9.562a13.187 13.187 0 00-4.084 2.58H11.26l1.564 2.79a10.82 10.82 0 014.494-2.43l1.07 1.913a.43.43 0 00.744 0l.948-1.694A10.8 10.8 0 0124 18.568v-.006a10.835 10.835 0 00-10.834-10.834c-.178 0-.355.005-.531.013L11.21 5.557c.59-.06 1.188-.09 1.789-.09A13.254 13.254 0 0126.25 18.718v.012h-2.16a11.098 11.098 0 00-11.09-10.998A11.1 11.1 0 001.91 18.73H.056A12.888 12.888 0 0113.055 5.576z" />
      </svg>
    ),
    phases: ['06', '07'],
    optional: true,
    settingsHint: 'Configura SENTRY_AUTH_TOKEN, SENTRY_ORG y SENTRY_PROJECT en el servidor',
  },
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ServiceStatus, { label: string; dotCls: string; badgeCls: string }> = {
  connected: {
    label: 'Conectado',
    dotCls: 'bg-emerald-500',
    badgeCls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  partial: {
    label: 'Parcial',
    dotCls: 'bg-amber-500',
    badgeCls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  missing: {
    label: 'No configurado',
    dotCls: 'bg-rose-400',
    badgeCls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  },
  error: {
    label: 'Error',
    dotCls: 'bg-rose-500',
    badgeCls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

// ── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({ service }: { service: InfraService }) {
  const meta = SERVICE_META[service.id]
  if (!meta) return null
  const sc = STATUS_CONFIG[service.status]
  const d = service.details

  return (
    <div className={`rounded-xl border bg-white p-4 dark:bg-gray-900 transition-all ${
      service.status === 'connected'
        ? 'border-gray-200 dark:border-gray-700'
        : service.status === 'partial'
          ? 'border-amber-200 dark:border-amber-800/40'
          : service.status === 'missing'
            ? 'border-rose-200 dark:border-rose-800/40'
            : 'border-rose-300 dark:border-rose-800/40'
    }`}>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            service.status === 'connected'
              ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              : service.status === 'partial'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
          }`}>
            {meta.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{meta.label}</span>
              {meta.optional && (
                <span className="rounded px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500">
                  opcional
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{meta.description}</p>
          </div>
        </div>

        {/* Status badge */}
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${sc.badgeCls}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dotCls}`} />
          {sc.label}
        </span>
      </div>

      {/* Details */}
      <div className="mb-3 space-y-1.5 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/50">
        {service.status === 'connected' && (
          <>
            {service.id === 'github' && (
              <>
                <DetailRow label="Repo" value={String(d.repoName ?? '')} href={String(d.url ?? '')} />
                <DetailRow label="Branch" value={String(d.defaultBranch ?? 'main')} />
                {d.pushedAt && <DetailRow label="Último push" value={relativeTime(String(d.pushedAt))} />}
                <DetailRow label="Visibilidad" value={d.private ? 'Privado' : 'Público'} />
              </>
            )}
            {service.id === 'supabase' && (
              <>
                <DetailRow label="Proyecto" value={String(d.name ?? d.projectRef ?? '')} />
                <DetailRow label="Region" value={String(d.region ?? '—')} />
                <DetailRow label="Estado DB" value={String(d.dbStatus ?? '—')} />
              </>
            )}
            {service.id === 'github_actions' && (
              <>
                <DetailRow label="Último run" value={`${d.conclusion ?? d.status}`} href={String(d.runUrl ?? '')} />
                {d.updatedAt && <DetailRow label="Actualizado" value={relativeTime(String(d.updatedAt))} />}
              </>
            )}
            {service.id === 'vercel' && (
              <>
                <DetailRow label="Estado" value={String(d.status ?? '')} />
                {d.url && <DetailRow label="URL" value={String(d.url)} href={String(d.url)} />}
                {d.createdAt && <DetailRow label="Último deploy" value={relativeTime(String(d.createdAt))} />}
              </>
            )}
            {service.id === 'anthropic' && (
              <DetailRow label="Modelo activo" value="claude-sonnet-4-6" />
            )}
            {service.id === 'sentry' && (
              <>
                {d.org && <DetailRow label="Org" value={String(d.org)} />}
                {d.project && <DetailRow label="Proyecto" value={String(d.project)} />}
              </>
            )}
          </>
        )}

        {(service.status === 'partial' || service.status === 'missing' || service.status === 'error') && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            {String(d.reason ?? d.error ?? 'Servicio no disponible')}
          </p>
        )}

        {service.status === 'partial' && service.id === 'vercel' && !!d.workflowUrl && (
          <DetailRow label="Workflow" value="deploy.yml" href={String(d.workflowUrl)} />
        )}
      </div>

      {/* Required by phases */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-0.5">Fases:</span>
          {meta.phases.map((ph) => (
            <span
              key={ph}
              className="rounded px-1 py-0.5 text-[10px] font-mono font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            >
              {ph}
            </span>
          ))}
        </div>

        {service.status !== 'connected' && meta.settingsHint && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 text-right max-w-[160px] leading-tight">
            {meta.settingsHint}
          </span>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-[11px] font-medium text-violet-600 hover:underline dark:text-violet-400 max-w-[220px]"
        >
          {value}
        </a>
      ) : (
        <span className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-300 max-w-[220px]">
          {value}
        </span>
      )}
    </div>
  )
}

// ── Summary bar ──────────────────────────────────────────────────────────────

function SummaryBar({ services }: { services: InfraService[] }) {
  const connected = services.filter((s) => s.status === 'connected').length
  const partial = services.filter((s) => s.status === 'partial').length
  const missing = services.filter((s) => s.status === 'missing' || s.status === 'error').length
  const total = services.length

  const readinessScore = Math.round(((connected + partial * 0.5) / total) * 100)

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* Score */}
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
          readinessScore >= 80
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : readinessScore >= 50
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
        }`}>
          {readinessScore}%
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {readinessScore >= 80 ? 'Listo para producción' : readinessScore >= 50 ? 'Configuración parcial' : 'Requiere configuración'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {connected} conectado{connected !== 1 ? 's' : ''} · {partial} parcial{partial !== 1 ? 'es' : ''} · {missing} pendiente{missing !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-1 min-w-[120px]">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              readinessScore >= 80 ? 'bg-emerald-500' : readinessScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex gap-2">
        {connected > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {connected} OK
          </span>
        )}
        {partial > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {partial} parcial
          </span>
        )}
        {missing > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            {missing} pendiente
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function InfrastructureDashboard({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const [services, setServices] = useState<InfraService[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  async function fetchStatus() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/infrastructure`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setServices(data.services)
      setLastChecked(new Date())
    } catch {
      setError('No se pudo cargar el estado de la infraestructura')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Infraestructura & Herramientas
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Estado de las integraciones necesarias para operar <span className="font-medium text-gray-700 dark:text-gray-300">{projectName}</span> en producción.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Verificando…' : 'Actualizar'}
            </button>
            {lastChecked && !loading && (
              <span className="text-[10px] text-gray-400 dark:text-gray-600">
                Verificado {relativeTime(lastChecked.toISOString())}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !services && (
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {services && (
        <>
          <SummaryBar services={services} />

          <div className="grid gap-4 sm:grid-cols-2">
            {Object.keys(SERVICE_META).map((id) => {
              const svc = services.find((s) => s.id === id)
              if (!svc) return null
              return <ServiceCard key={id} service={svc} />
            })}
          </div>

          {/* Footer hint */}
          <div className="mt-6 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-medium text-gray-600 dark:text-gray-300">Cómo configurar:</span>{' '}
              GitHub, Supabase y su token se configuran en{' '}
              <button
                onClick={() => {
                  // Trigger edit project modal — navigate to dashboard with project selected
                  document.dispatchEvent(new CustomEvent('open-edit-project'))
                }}
                className="text-violet-600 hover:underline dark:text-violet-400"
              >
                Editar proyecto
              </button>
              . Las variables de entorno del servidor (ANTHROPIC_API_KEY, SENTRY_*) se configuran en Vercel Dashboard → Settings → Environment Variables.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
