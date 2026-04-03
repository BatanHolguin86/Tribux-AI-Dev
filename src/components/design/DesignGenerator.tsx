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

      // Refresh artifact list (map API fields to component fields)
      const listRes = await fetch(`/api/projects/${projectId}/designs`)
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
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-[#0F2B46] dark:hover:text-[#0EA5A3]"
          aria-label="Volver al hub de Diseño y UX"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al hub de Diseño &amp; UX
        </button>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F4F8] dark:bg-[#0F2B46]/30 text-xl shadow-sm">
              {resolvedTemplate.icon}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#0F2B46] dark:text-[#0EA5A3]">
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
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#0F2B46] shadow-sm ring-1 ring-[#0EA5A3]/30 dark:bg-gray-900 dark:text-[#0EA5A3]/30 dark:ring-[#0F2B46]">
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

        <div className="flex flex-col rounded-xl border-2 border-[#0EA5A3]/30/80 bg-white shadow-sm dark:border-[#0F2B46]/50 dark:bg-gray-900">
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
        <h1 className="text-2xl font-display font-bold tracking-tight text-[#0F2B46] dark:text-gray-100">Disena tu app</h1>
        <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">
          Selecciona tus features, elige el nivel de detalle y genera los diseños visuales.
        </p>
      </header>

      {/* Main action: generate designs from features */}
      <section className="relative mb-8 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#1E3A55] dark:bg-[#0F2B46] md:p-6">
        {isGenerating && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/90 p-6 text-center backdrop-blur-sm dark:bg-[#0F2B46]/90"
            role="status"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#0EA5A3]/30 border-t-[#0EA5A3]" />
            <p className="mt-4 text-sm font-display font-semibold text-[#0F2B46] dark:text-white">Generando diseños...</p>
            <p className="mt-1 text-xs text-[#94A3B8]">Esto puede tomar hasta 1 minuto</p>
          </div>
        )}
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Selecciona features para disenar
            </label>
            {completedFeatures.length > 0 ? (
              <div className="mt-2 space-y-1 rounded-lg border border-[#E2E8F0] p-3 dark:border-[#1E3A55]">
                {completedFeatures.map((feature) => {
                  const missing: string[] = []
                  if (!feature.hasRequirements) missing.push('Requisitos')
                  if (!feature.hasDesign) missing.push('Diseno')
                  if (!feature.hasTasks) missing.push('Tasks')

                  return (
                    <label
                      key={feature.id}
                      className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
                        feature.isComplete
                          ? 'cursor-pointer hover:bg-[#E8F4F8] dark:hover:bg-[#0F2B46]/30'
                          : 'cursor-not-allowed opacity-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeatures.has(feature.id)}
                        disabled={!feature.isComplete}
                        onChange={() => {
                          if (!feature.isComplete) return
                          setSelectedFeatures((prev) => {
                            const next = new Set(prev)
                            next.has(feature.id) ? next.delete(feature.id) : next.add(feature.id)
                            return next
                          })
                        }}
                        className="rounded border-gray-300 text-[#0EA5A3] focus:ring-[#0EA5A3] disabled:opacity-30"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`${feature.isComplete ? 'text-[#0F2B46] dark:text-gray-200' : 'text-gray-400'}`}>
                          {feature.name}
                        </span>
                        {!feature.isComplete && (
                          <p className="text-[10px] text-red-500">
                            Falta: {missing.join(', ')}
                          </p>
                        )}
                      </div>
                      {feature.isComplete && (
                        <span className="shrink-0 text-[10px] text-[#10B981]">✓ Completo</span>
                      )}
                    </label>
                  )
                })}
                {selectedFeatures.size > 0 && (
                  <p className="mt-1 text-[10px] text-[#0EA5A3]">{selectedFeatures.size} feature(s) seleccionado(s)</p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-[#94A3B8]">No hay features. Crea specs en Phase 01 primero.</p>
            )}
            <label className="mt-3 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Pantallas adicionales (opcional)
            </label>
            <input
              type="text"
              value={screensInput}
              onChange={(e) => setScreensInput(e.target.value)}
              placeholder="Landing page, Perfil de usuario..."
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:shadow-gray-900/20 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Tipo de diseño</label>
            <div className="mt-1 flex gap-3 text-xs">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={type === 'wireframe'}
                  onChange={() => setType('wireframe')}
                />
                Wireframe
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={type === 'mockup_lowfi'}
                  onChange={() => setType('mockup_lowfi')}
                />
                Mockup low-fi
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={type === 'mockup_highfi'}
                  onChange={() => setType('mockup_highfi')}
                />
                Mockup high-fi
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Instrucciones de refinamiento (opcional)
            </label>
            <textarea
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              placeholder="Ej: estilo minimalista, enfasis en CTA principal..."
              rows={2}
              className="mt-1 w-full resize-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:shadow-gray-900/20 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
            />
          </div>
          {generateError && (
            <div className="rounded-md border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
              {generateError}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerateFromSpecs}
              disabled={(selectedFeatures.size === 0 && !screensInput.trim()) || isGenerating}
              className="rounded-lg bg-[#0F2B46] px-5 py-2.5 text-sm font-semibold text-white shadow-sm dark:shadow-gray-900/20 transition-colors hover:bg-[#0A1F33] disabled:opacity-50"
            >
              {isGenerating ? 'Generando…' : 'Generar y guardar en el proyecto'}
            </button>
          </div>
        </div>
      </section>

      {/* Secondary options */}
      <div className="mb-8 flex flex-wrap gap-3">
        {/* Import from external tools */}
        <button
          type="button"
          onClick={() => setShowExternalImport(true)}
          className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#0F2B46] transition-colors hover:border-[#0EA5A3] hover:bg-[#E8F4F8] dark:border-[#1E3A55] dark:bg-[#0F2B46] dark:text-gray-200 dark:hover:border-[#0EA5A3]"
        >
          🎨 Importar desde Figma, V0 o Lovable
        </button>

        {/* Chat with designer */}
        <button
          type="button"
          onClick={() => handleSelectTemplate('wireframes')}
          className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#0F2B46] transition-colors hover:border-[#0EA5A3] hover:bg-[#E8F4F8] dark:border-[#1E3A55] dark:bg-[#0F2B46] dark:text-gray-200 dark:hover:border-[#0EA5A3]"
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
        <h3 className="mb-1 text-sm font-display font-semibold uppercase tracking-wider text-[#94A3B8]">
          Diseños generados
        </h3>
        <p className="mb-3 text-xs text-[#94A3B8]">
          Haz click en un diseño para verlo, aprobarlo o refinarlo.
        </p>
        {artifacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-8 text-center dark:border-gray-600 dark:bg-gray-900/40">
            <p className="text-sm text-[#94A3B8]">
              Aun no hay diseños. Selecciona features arriba y genera tus primeros wireframes.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {artifacts.map((artifact) => (
              <Link
                key={artifact.id}
                href={`/projects/${projectId}/designs/${artifact.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 transition-colors hover:border-[#0EA5A3] hover:bg-gray-50 dark:hover:bg-gray-800 sm:px-4 sm:py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
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
                </div>
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
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
