'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { DesignWorkflowContext } from '@/lib/ai/context-builder'
import { DESIGN_TEMPLATES } from '@/lib/ai/agents/ui-ux-designer'
import {
  buildDesignToolInitialUserMessage,
  DESIGN_KIT_TOOL_SEQUENCE,
  getDesignToolCardMeta,
  getDesignToolFlowForUi,
} from '@/lib/design/design-tool-workflow'
import { DesignChat } from './DesignChat'
import { ExternalToolImportModal } from './ExternalToolImportModal'

const ORDERED_KIT_TEMPLATES = DESIGN_KIT_TOOL_SEQUENCE.filter((id) => id !== 'custom')
  .map((id) => DESIGN_TEMPLATES.find((t) => t.id === id))
  .filter((t): t is (typeof DESIGN_TEMPLATES)[number] => Boolean(t))

type Artifact = {
  id: string
  title: string
  document_type: string
  status: string
  created_at: string
  thumb_srcdoc?: string | null
}

const TYPE_LABELS: Record<string, string> = {
  wireframe: 'Wireframe',
  mockup_lowfi: 'Mockup Low-Fi',
  mockup_highfi: 'Mockup High-Fi',
}

type FeatureOption = { id: string; name: string; isComplete: boolean; hasRequirements: boolean; hasDesign: boolean; hasTasks: boolean }

type DesignGeneratorProps = {
  projectId: string
  existingArtifacts: Artifact[]
  workflowContext: DesignWorkflowContext
  connectedTools?: { figma: boolean; v0: boolean }
  completedFeatures?: FeatureOption[]
}

export function DesignGenerator({
  projectId,
  existingArtifacts,
  workflowContext,
  connectedTools = { figma: false, v0: false },
  completedFeatures = [],
}: DesignGeneratorProps) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>(existingArtifacts)
  const [screensInput, setScreensInput] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
  const [type, setType] = useState<'wireframe' | 'mockup_lowfi' | 'mockup_highfi'>('wireframe')
  const [refinement, setRefinement] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [showExternalImport, setShowExternalImport] = useState(false)
  const [externalTab, setExternalTab] = useState<'figma' | 'v0' | 'lovable'>('figma')

  const mapArtifactRow = useCallback((a: Record<string, unknown>): Artifact => {
    return {
      id: String(a.id),
      title: String(a.screen_name ?? a.title ?? ''),
      document_type: String(a.type ?? a.document_type ?? ''),
      status: String(a.status),
      created_at: String(a.created_at),
      thumb_srcdoc: typeof a.thumb_srcdoc === 'string' ? a.thumb_srcdoc : null,
    }
  }, [])

  const refreshArtifactsWithThumbs = useCallback(async () => {
    try {
      const listRes = await fetch(`/api/projects/${projectId}/designs?thumb=1`)
      if (!listRes.ok) return
      const json = (await listRes.json()) as { artifacts?: Record<string, unknown>[] }
      if (Array.isArray(json.artifacts)) {
        setArtifacts(json.artifacts.map(mapArtifactRow))
      }
    } catch {
      /* ignore */
    }
  }, [projectId, mapArtifactRow])

  useEffect(() => {
    if (existingArtifacts.length === 0) return
    void refreshArtifactsWithThumbs()
  }, [existingArtifacts.length, projectId, refreshArtifactsWithThumbs])

  async function handleSelectTemplate(templateId: string) {
    setGenerateError(null)
    try {
      // Create a new thread with the UI/UX Designer agent
      const res = await fetch(`/api/projects/${projectId}/agents/ui_ux_designer/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Design: ${templateId}` }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setGenerateError(body?.message || body?.error || `Error ${res.status} al crear hilo con el agente`)
        return
      }

      const data = await res.json()
      setThreadId(data.id)
      setActiveTemplate(templateId)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Error de conexion al crear hilo')
    }
  }

  function handleBack() {
    setActiveTemplate(null)
    setThreadId(null)
  }

  const template = DESIGN_TEMPLATES.find((t) => t.id === activeTemplate)
  const customTemplate = {
    id: 'custom',
    title: 'Diseno Custom',
    description: 'Describe lo que necesitas al UI/UX Designer con contexto de producto.',
    icon: '✏️',
    prompt: '',
  }
  const resolvedTemplate = template ?? (activeTemplate === 'custom' ? customTemplate : null)

  const composedInitialPrompt = useMemo(() => {
    if (!activeTemplate) return ''
    const tmpl =
      DESIGN_TEMPLATES.find((t) => t.id === activeTemplate) ??
      (activeTemplate === 'custom'
        ? { id: 'custom' as const, title: 'Diseno Custom', prompt: '', description: '', icon: '✏️' }
        : null)
    if (!tmpl) return ''
    const base =
      tmpl.prompt?.trim() ||
      (activeTemplate === 'custom'
        ? 'Con una sola pregunta clara, pide al usuario que describa el entregable de diseno/UX que necesita (alcance, pantallas, estilo), usando el contexto de producto ya incluido arriba.'
        : '')
    return buildDesignToolInitialUserMessage(workflowContext, activeTemplate, tmpl.title, base)
  }, [activeTemplate, workflowContext])

  async function handleGenerateFromSpecs() {
    // Use selected features + manual input
    const fromFeatures = completedFeatures
      .filter((f) => selectedFeatures.has(f.id))
      .map((f) => f.name)
    const fromInput = screensInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const screens = [...fromFeatures, ...fromInput]

    if (screens.length === 0) return

    setIsGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/designs/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          screens,
          refinement: refinement || undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setGenerateError(body?.message || body?.error || `Error ${res.status}`)
        return
      }

      // Wait for stream to complete (keeps Vercel connection alive)
      await res.text()

      // Refresh artifact list
      await refreshArtifactsWithThumbs()
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Error de conexion')
    } finally {
      setIsGenerating(false)
    }
  }

  // Active chat view
  if (activeTemplate && threadId && resolvedTemplate) {
    const flow = getDesignToolFlowForUi(activeTemplate)
    return (
      <div>
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-teal"
          aria-label="Volver al hub de Diseño y UX"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al hub de Diseño &amp; UX
        </button>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-surface dark:bg-brand-primary/30 text-xl shadow-sm">
              {resolvedTemplate.icon}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-primary dark:text-brand-teal">
                Camino B · Agente UI/UX
              </p>
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">{resolvedTemplate.title}</h2>
              <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{flow.uxDeliverable}</p>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
            <strong className="font-semibold">Qué hacer:</strong> espera la respuesta abajo (síntesis CTO + entregable).
            Valida o pide ajustes en el chat; el agente va por partes si el resultado es largo. Avanzar de fase del
            proyecto solo cuando tú apruebes en la UI de cada fase.
          </div>
        </div>

        <details className="mb-4 rounded-xl border border-gray-200 bg-gray-50/90 text-sm dark:border-gray-700 dark:bg-gray-900/50">
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
            Ver guía: alineación CTO, pasos y contexto Discovery
          </summary>
          <div className="space-y-3 border-t border-gray-200 px-4 py-3 text-xs dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-brand-primary shadow-sm ring-1 ring-[#0EA5A3]/30 dark:bg-gray-900 dark:text-brand-teal/30 dark:ring-[#0F2B46]">
                1 · Alineación CTO
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-fuchsia-800 shadow-sm ring-1 ring-fuchsia-200 dark:bg-gray-900 dark:text-fuchsia-200 dark:ring-fuchsia-800">
                2 · Entrega UI/UX
              </span>
            </div>
            <p className="leading-relaxed text-gray-700 dark:text-gray-300">{flow.ctoAlignment}</p>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">Pasos del agente</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-gray-600 dark:text-gray-400">
                {flow.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <div className="rounded-md border border-gray-200 bg-white/90 p-3 dark:border-gray-700 dark:bg-gray-900/70">
              <p className="mb-2 text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                Ya enviado al agente (Discovery)
              </p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Proyecto:</span>{' '}
                  {workflowContext.projectName}
                </li>
                {workflowContext.industry && (
                  <li>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Industria:</span>{' '}
                    {workflowContext.industry}
                  </li>
                )}
                {workflowContext.businessPersona && (
                  <li>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Persona (perfil):</span>{' '}
                    <span className="line-clamp-3">{workflowContext.businessPersona}</span>
                  </li>
                )}
                {workflowContext.discoveryPersonas && (
                  <li>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Personas Discovery:</span>{' '}
                    <span className="line-clamp-4 whitespace-pre-wrap">{workflowContext.discoveryPersonas}</span>
                  </li>
                )}
                {workflowContext.valueProposition && (
                  <li>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Propuesta de valor:</span>{' '}
                    <span className="line-clamp-4 whitespace-pre-wrap">{workflowContext.valueProposition}</span>
                  </li>
                )}
                {!workflowContext.discoveryPersonas && !workflowContext.valueProposition && (
                  <li className="text-amber-700 dark:text-amber-400">
                    Aún no hay secciones <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">personas</code> o{' '}
                    <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">value_proposition</code> aprobadas en
                    Phase 00. Completa Discovery para mejores resultados.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </details>

        <div className="flex flex-col rounded-xl border-2 border-brand-teal/30/80 bg-white shadow-sm dark:border-brand-primary/50 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <p className="text-center text-[11px] font-medium text-gray-500 dark:text-gray-400">
              Conversación · UI/UX Designer
            </p>
          </div>
          <div className="h-[min(70vh,560px)] min-h-[300px]">
            <DesignChat
              projectId={projectId}
              threadId={threadId}
              initialPrompt={composedInitialPrompt}
              onCaminoAGenerateSuccess={refreshArtifactsWithThumbs}
            />
          </div>
        </div>
      </div>
    )
  }

  // Simplified unified design hub
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight text-brand-primary dark:text-gray-100">Disena tu app</h1>
        <p className="mt-1 text-sm text-brand-muted dark:text-gray-400">
          Selecciona tus features, elige el nivel de detalle y genera los diseños visuales.
        </p>
      </header>

      {/* Main action: generate designs from features */}
      <section className="relative mb-8 rounded-2xl border border-brand-border bg-white p-5 shadow-sm dark:border-brand-border-dark dark:bg-brand-primary md:p-6">
        {isGenerating && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/90 p-6 text-center backdrop-blur-sm dark:bg-brand-primary/90"
            role="status"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-teal/30 border-t-[#0EA5A3]" />
            <p className="mt-4 text-sm font-display font-semibold text-brand-primary dark:text-white">Generando diseños...</p>
            <p className="mt-1 text-xs text-brand-muted">Esto puede tomar hasta 1 minuto</p>
          </div>
        )}
        <div className="space-y-5">
          {/* Feature selector */}
          <div>
            <p className="mb-3 text-sm font-display font-semibold text-brand-primary dark:text-gray-100">
              1. Selecciona features
            </p>
            {(() => {
              const ready = completedFeatures.filter((f) => f.isComplete)
              const pending = completedFeatures.filter((f) => !f.isComplete)

              if (completedFeatures.length === 0) {
                return (
                  <div className="rounded-xl border border-dashed border-brand-border bg-[#F8FAFC] px-4 py-6 text-center dark:border-brand-border-dark dark:bg-brand-navy">
                    <p className="text-sm text-brand-muted">Completa specs en Phase 01 para desbloquear el diseno.</p>
                  </div>
                )
              }

              return (
                <div className="space-y-2">
                  {ready.map((feature) => (
                    <label
                      key={feature.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                        selectedFeatures.has(feature.id)
                          ? 'border-brand-teal bg-brand-teal/5'
                          : 'border-brand-border bg-white hover:border-brand-teal/50 dark:border-brand-border-dark dark:bg-brand-primary'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeatures.has(feature.id)}
                        onChange={() => {
                          setSelectedFeatures((prev) => {
                            const next = new Set(prev)
                            next.has(feature.id) ? next.delete(feature.id) : next.add(feature.id)
                            return next
                          })
                        }}
                        className="h-4 w-4 rounded border-brand-border text-brand-teal focus:ring-[#0EA5A3]"
                      />
                      <span className="flex-1 text-sm font-medium text-brand-primary dark:text-gray-100">{feature.name}</span>
                      <span className="rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-medium text-[#10B981]">Listo</span>
                    </label>
                  ))}
                  {pending.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-brand-muted hover:text-brand-muted">
                        {pending.length} feature(s) pendientes de completar
                      </summary>
                      <div className="mt-2 space-y-1 pl-2">
                        {pending.map((feature) => {
                          const missing: string[] = []
                          if (!feature.hasRequirements) missing.push('Requisitos')
                          if (!feature.hasDesign) missing.push('Diseno')
                          if (!feature.hasTasks) missing.push('Tasks')
                          return (
                            <div key={feature.id} className="flex items-center gap-2 py-1 text-xs text-brand-muted">
                              <span className="h-4 w-4 rounded border border-brand-border" />
                              <span>{feature.name}</span>
                              <span className="text-[10px] text-[#EF4444]">Falta: {missing.join(', ')}</span>
                            </div>
                          )
                        })}
                      </div>
                    </details>
                  )}
                  {selectedFeatures.size > 0 && (
                    <p className="text-xs font-medium text-brand-teal">{selectedFeatures.size} seleccionado(s)</p>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Design type — pill buttons */}
          <div>
            <p className="mb-3 text-sm font-display font-semibold text-brand-primary dark:text-gray-100">
              2. Nivel de detalle
            </p>
            <div className="flex gap-2">
              {([
                { value: 'wireframe' as const, label: 'Wireframe', desc: 'Estructura basica' },
                { value: 'mockup_lowfi' as const, label: 'Mockup', desc: 'Con colores y estilo' },
                { value: 'mockup_highfi' as const, label: 'Detallado', desc: 'Listo para desarrollo' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex-1 rounded-xl border-2 px-3 py-3 text-center transition-all ${
                    type === opt.value
                      ? 'border-brand-teal bg-brand-teal/5 text-brand-primary dark:text-white'
                      : 'border-brand-border bg-white text-brand-muted hover:border-brand-teal/50 dark:border-brand-border-dark dark:bg-brand-primary dark:text-gray-400'
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-[10px]">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Optional refinement */}
          <div>
            <p className="mb-2 text-sm font-display font-semibold text-brand-primary dark:text-gray-100">
              3. Instrucciones (opcional)
            </p>
            <input
              type="text"
              value={screensInput}
              onChange={(e) => setScreensInput(e.target.value)}
              placeholder="Pantallas extra: Landing, Perfil..."
              className="w-full rounded-xl border border-brand-border bg-[#F8FAFC] px-4 py-2.5 text-sm text-brand-primary placeholder:text-brand-muted focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-[#0EA5A3]/20 dark:border-brand-border-dark dark:bg-brand-navy dark:text-gray-200"
            />
            <textarea
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              placeholder="Ej: estilo minimalista, enfasis en CTA principal..."
              rows={2}
              className="mt-2 w-full resize-none rounded-xl border border-brand-border bg-[#F8FAFC] px-4 py-2.5 text-sm text-brand-primary placeholder:text-brand-muted focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-[#0EA5A3]/20 dark:border-brand-border-dark dark:bg-brand-navy dark:text-gray-200"
            />
          </div>

          {generateError && (
            <div className="rounded-xl border-l-4 border-[#EF4444] bg-[#EF4444]/5 px-4 py-3 text-sm text-[#EF4444]">
              {generateError}
            </div>
          )}

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerateFromSpecs}
            disabled={(selectedFeatures.size === 0 && !screensInput.trim()) || isGenerating}
            className="w-full rounded-xl bg-brand-teal py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0C8C8A] disabled:opacity-40"
          >
            {isGenerating ? 'Generando diseños...' : `Generar diseños${selectedFeatures.size > 0 ? ` (${selectedFeatures.size} features)` : ''}`}
          </button>
        </div>
      </section>

      {/* Secondary options */}
      <div className="mb-8 flex flex-wrap gap-3">
        {/* Import from external tools */}
        <button
          type="button"
          onClick={() => setShowExternalImport(true)}
          className="flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm font-medium text-brand-primary transition-colors hover:border-brand-teal hover:bg-brand-surface dark:border-brand-border-dark dark:bg-brand-primary dark:text-gray-200 dark:hover:border-brand-teal"
        >
          🎨 Importar desde Figma, V0 o Lovable
        </button>

        {/* Chat with designer */}
        <button
          type="button"
          onClick={() => handleSelectTemplate('wireframes')}
          className="flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm font-medium text-brand-primary transition-colors hover:border-brand-teal hover:bg-brand-surface dark:border-brand-border-dark dark:bg-brand-primary dark:text-gray-200 dark:hover:border-brand-teal"
        >
          💬 Chat con el disenador IA
        </button>
      </div>

      <ExternalToolImportModal
        projectId={projectId}
        isOpen={showExternalImport}
        initialTab={externalTab}
        connectedTools={connectedTools}
        onClose={() => setShowExternalImport(false)}
        onImported={() => refreshArtifactsWithThumbs()}
      />

      {/* Diseños generados */}
      <div className="mt-8">
        <h3 className="mb-1 text-sm font-display font-semibold uppercase tracking-wider text-brand-muted">
          Diseños generados
        </h3>
        <p className="mb-3 text-xs text-brand-muted">
          Haz click en un diseño para verlo, aprobarlo o refinarlo.
        </p>
        {artifacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-8 text-center dark:border-gray-600 dark:bg-gray-900/40">
            <p className="text-sm text-brand-muted">
              Aun no hay diseños. Selecciona features arriba y genera tus primeros wireframes.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="group flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 transition-colors hover:border-brand-teal hover:bg-gray-50 dark:hover:bg-gray-800 sm:px-4 sm:py-3"
              >
                <Link
                  href={`/projects/${projectId}/designs/${artifact.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="relative h-20 w-[5.5rem] shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
                    {artifact.thumb_srcdoc ? (
                      <iframe
                        title=""
                        sandbox="allow-same-origin"
                        className="pointer-events-none h-full w-full scale-[0.98] border-0"
                        srcDoc={artifact.thumb_srcdoc}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E8F4F8] to-[#E8F4F8] text-xl dark:from-[#0A1F33] dark:to-[#0A1F33]">
                        🎨
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {artifact.title || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {TYPE_LABELS[artifact.document_type] || artifact.document_type} · {new Date(artifact.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    artifact.status === 'approved'
                      ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : artifact.status === 'generating'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {artifact.status === 'approved' ? 'Aprobado' : artifact.status === 'generating' ? 'Generando...' : 'Draft'}
                  </span>
                  <button
                    onClick={async (e) => {
                      e.preventDefault()
                      if (!confirm('¿Eliminar este diseño?')) return
                      const res = await fetch(`/api/projects/${projectId}/designs/${artifact.id}`, { method: 'DELETE' })
                      if (res.ok) setArtifacts((prev) => prev.filter((a) => a.id !== artifact.id))
                    }}
                    className="hidden rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:block dark:hover:bg-red-900/20"
                    title="Eliminar diseño"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                  <Link href={`/projects/${projectId}/designs/${artifact.id}`}>
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
