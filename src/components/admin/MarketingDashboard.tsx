'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MARKETING_MODES, type MarketingMode } from '@/lib/ai/prompts/marketing-strategist'

type Artifact = {
  id: string
  title: string
  type: string
  status: string
  created_at: string
  updated_at: string
}

type Thread = {
  id: string
  title: string | null
  mode: string
  updated_at: string
}

const TYPE_LABELS: Record<string, string> = {
  brand_strategy: 'Brand Strategy',
  gtm_plan: 'GTM Plan',
  content_strategy: 'Content Strategy',
  growth_experiment: 'Growth Experiment',
  sales_playbook: 'Sales Playbook',
  competitive_messaging: 'Competitive Intel',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  archived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

const MODE_COLORS: Record<string, string> = {
  brand: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  gtm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  content: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  growth: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  sales: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  competitive: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
}

export function MarketingDashboard() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/marketing/artifacts').then((r) => r.ok ? r.json() : []),
      fetch('/api/admin/marketing/threads').then((r) => r.ok ? r.json() : []),
    ])
      .then(([a, t]) => {
        setArtifacts(a)
        setThreads(t)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalArtifacts = artifacts.length
  const approvedCount = artifacts.filter((a) => a.status === 'approved').length
  const experimentCount = artifacts.filter((a) => a.type === 'growth_experiment').length
  const threadCount = threads.length

  const kpis = [
    { label: 'Total Artefactos', value: totalArtifacts, color: 'text-brand-primary dark:text-white' },
    { label: 'Aprobados', value: approvedCount, color: 'text-green-600 dark:text-green-400' },
    { label: 'Experimentos', value: experimentCount, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Hilos de Chat', value: threadCount, color: 'text-brand-teal' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">
            Marketing & Ventas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Estrategia comercial de Tribux AI con Marketing Strategist Agent
          </p>
        </div>
        <Link
          href="/admin/marketing/chat"
          className="flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-teal/90 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          Hablar con Marketing Strategist
        </Link>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-brand-navy"
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.label}</p>
              <p className={`mt-1 text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mode overview */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-brand-navy">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Modos del Agente</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(MARKETING_MODES) as MarketingMode[]).map((mode) => {
            const modeArtifacts = artifacts.filter((a) => {
              const modeToType: Record<string, string> = {
                brand: 'brand_strategy', gtm: 'gtm_plan', content: 'content_strategy',
                growth: 'growth_experiment', sales: 'sales_playbook', competitive: 'competitive_messaging',
              }
              return a.type === modeToType[mode]
            })
            return (
              <Link
                key={mode}
                href={`/admin/marketing/chat`}
                className="rounded-lg border border-gray-100 p-3 text-center hover:border-brand-teal/30 hover:bg-brand-teal/5 transition-colors dark:border-gray-800 dark:hover:border-brand-teal/30"
              >
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${MODE_COLORS[mode]}`}>
                  {MARKETING_MODES[mode].label}
                </span>
                <p className="mt-2 text-lg font-bold text-gray-700 dark:text-gray-300">{modeArtifacts.length}</p>
                <p className="text-[10px] text-gray-400">artefactos</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent artifacts */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-brand-navy">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Artefactos Recientes</h2>
          <Link
            href="/admin/marketing/artifacts"
            className="text-xs font-medium text-brand-teal hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : artifacts.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            Aun no hay artefactos. Inicia una conversacion con el Marketing Strategist.
          </p>
        ) : (
          <div className="space-y-2">
            {artifacts.slice(0, 5).map((artifact) => (
              <div
                key={artifact.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 dark:border-gray-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {artifact.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${MODE_COLORS[artifact.type.replace('_strategy', '').replace('_plan', '').replace('_experiment', '').replace('_playbook', '').replace('_messaging', '')] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[artifact.type] ?? artifact.type}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${STATUS_COLORS[artifact.status] ?? STATUS_COLORS.draft}`}>
                      {artifact.status}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {new Date(artifact.updated_at).toLocaleDateString('es')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
