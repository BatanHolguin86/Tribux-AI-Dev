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

type DesignGeneratorProps = {
  projectId: string
  existingArtifacts: Artifact[]
  workflowContext: DesignWorkflowContext
  connectedTools?: { figma: boolean; v0: boolean }
}

export function DesignGenerator({
  projectId,
  existingArtifacts,
  workflowContext,
  connectedTools = { figma: false, v0: false },
}: DesignGeneratorProps) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>(existingArtifacts)
  const [screensInput, setScreensInput] = useState('')
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
    const screens = screensInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

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
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
          aria-label="Volver al hub de Diseño y UX"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al hub de Diseño &amp; UX
        </button>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30 text-xl shadow-sm">
              {resolvedTemplate.icon}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Camino B · Agente UI/UX
              </p>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{resolvedTemplate.title}</h2>
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
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-violet-800 shadow-sm ring-1 ring-violet-200 dark:bg-gray-900 dark:text-violet-200 dark:ring-violet-800">
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

        <div className="flex flex-col rounded-xl border-2 border-violet-200/80 bg-white shadow-sm dark:border-violet-900/50 dark:bg-gray-900">
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

  // Hub: two clear product paths (visual artifacts vs. agent-led design kit)
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Diseño &amp; UX</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Dos caminos complementarios, alineados a la metodología IA DLC:{' '}
          <strong className="text-gray-800 dark:text-gray-200">salidas visuales</strong> que quedan guardadas en el
          proyecto, y <strong className="text-gray-800 dark:text-gray-200">conversaciones guiadas</strong> con el agente
          UI/UX para sistema de diseño (tokens, componentes, flujos, responsive), usando personas y propuesta de valor
          del Discovery.
        </p>

        <ol className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Resumen del flujo">
          <li className="flex gap-3 rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
              A
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pantallas visuales</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                Genera wireframes o mockups por lista de pantallas. Ideal cuando ya tienes specs KIRO o una lista clara
                de vistas. El resultado aparece abajo y puedes abrirlo, aprobarlo o refinarlo.
              </p>
            </div>
          </li>
          <li className="flex gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              B
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Kit de diseño con agente</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                Elige una herramienta (pasos 1–6). Se abre un chat: el primer mensaje ya incluye contexto del proyecto y
                el flujo CTO + UX. Tu trabajo es leer la respuesta y pedir ajustes en el mismo hilo.
              </p>
            </div>
          </li>
        </ol>
      </header>

      {/* Camino A */}
      <section
        className="relative mb-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-6"
        aria-labelledby="camino-a-title"
      >
        {isGenerating && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/85 p-6 text-center backdrop-blur-sm dark:bg-gray-900/85"
            role="status"
            aria-live="polite"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-violet-500/30 border-t-violet-600" />
            <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Generando diseños…</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              La IA está creando HTML+Tailwind por cada pantalla en el servidor. Suele tardar entre unos segundos y un
              minuto; no cierres esta pestaña.
            </p>
          </div>
        )}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
            Camino A
          </span>
          <h2 id="camino-a-title" className="text-base font-bold text-gray-900 dark:text-gray-100">
            Pantallas visuales (wireframe / mockup)
          </h2>
        </div>
        <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">
          Escribe pantallas separadas por coma, elige tipo y opcionalmente refina. La generación es{' '}
          <strong className="text-gray-800 dark:text-gray-200">síncrona</strong>: verás el estado “Generando…” hasta
          que termine (sin polling). Tras generar, revisa la lista <strong className="text-gray-800 dark:text-gray-200">Diseños generados</strong>{' '}
          (vista miniatura cuando hay HTML guardado) y abre cada artefacto para aprobar o refinar.
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Pantallas / flujos
            </label>
            <input
              type="text"
              value={screensInput}
              onChange={(e) => setScreensInput(e.target.value)}
              placeholder="Login, Dashboard, Detalle de presupuesto..."
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:shadow-gray-900/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
              className="mt-1 w-full resize-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:shadow-gray-900/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
              disabled={!screensInput.trim() || isGenerating}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm dark:shadow-gray-900/20 transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              {isGenerating ? 'Generando…' : 'Generar y guardar en el proyecto'}
            </button>
          </div>
        </div>
      </section>

      {/* Error display for template actions */}
      {generateError && !screensInput.trim() && (
        <div className="mb-4 rounded-md border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {generateError}
        </div>
      )}

      {/* Camino B */}
      <section
        className="mb-10 rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white p-5 dark:border-indigo-900/50 dark:from-indigo-950/20 dark:to-gray-900 md:p-6"
        aria-labelledby="camino-b-title"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            Camino B
          </span>
          <h2 id="camino-b-title" className="text-base font-bold text-gray-900 dark:text-gray-100">
            Kit de diseño con agente (orden sugerido 1 → 6)
          </h2>
        </div>
        <p className="mb-5 max-w-3xl text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          Cada tarjeta <strong className="text-gray-800 dark:text-gray-200">crea un hilo nuevo</strong> con el UI/UX
          Designer. No hace falta copiar prompts: el sistema envía personas, propuesta de valor y el guion de la
          herramienta. Los tiempos son orientativos (IA).
        </p>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ORDERED_KIT_TEMPLATES.map((tmpl) => {
            const meta = getDesignToolCardMeta(tmpl.id)
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.id)}
                className="group flex flex-col rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-lg dark:bg-indigo-900/30">
                    {tmpl.icon}
                  </span>
                  <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-gray-100 dark:text-gray-900">
                    Paso {meta.step}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{tmpl.title}</h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  {meta.outcomeLine}
                </p>
                <p className="mt-3 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  Abrir conversación guiada · {meta.durationHint}
                </p>
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => handleSelectTemplate('custom')}
            className="flex flex-col rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/80 p-4 text-left transition-all hover:border-indigo-400 hover:bg-white dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-lg dark:bg-gray-700">
                ✏️
              </span>
              <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-gray-100 dark:text-gray-900">
                Paso {getDesignToolCardMeta('custom').step}
              </span>
            </div>
            <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">Diseño custom</h3>
            <p className="mt-1 flex-1 text-xs text-gray-600 dark:text-gray-400">
              {getDesignToolCardMeta('custom').outcomeLine}
            </p>
            <p className="mt-3 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              Abrir conversación guiada · {getDesignToolCardMeta('custom').durationHint}
            </p>
          </button>
        </div>
      </section>

      {/* Camino C */}
      <section
        className="mb-10 rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white p-5 dark:border-emerald-900/50 dark:from-emerald-950/20 dark:to-gray-900 md:p-6"
        aria-labelledby="camino-c-title"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            Camino C
          </span>
          <h2 id="camino-c-title" className="text-base font-bold text-gray-900 dark:text-gray-100">
            Herramientas externas
          </h2>
        </div>
        <p className="mb-5 max-w-3xl text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          Importa diseños profesionales de herramientas externas. Los artefactos importados se integran al mismo flujo de
          aprobacion y alimentan Phase 04 (desarrollo).
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {([
            {
              id: 'figma' as const,
              label: 'Figma',
              description: 'Importar frames de un archivo Figma como imagenes PNG.',
              icon: (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                  <path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4zM4 12c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4zM4 4c0-2.2 1.8-4 4-4h4v8H8C5.8 8 4 6.2 4 4zM12 0h4c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4V0zM20 12c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z" />
                </svg>
              ),
              connected: connectedTools.figma,
            },
            {
              id: 'v0' as const,
              label: 'V0 by Vercel',
              description: 'Pegar codigo React+Tailwind generado en V0.',
              icon: (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                  <path d="M12 1L24 22H0L12 1z" />
                </svg>
              ),
              connected: connectedTools.v0,
            },
            {
              id: 'lovable' as const,
              label: 'Lovable',
              description: 'Vincular un proyecto de Lovable como referencia de diseño.',
              icon: <span className="text-lg">💜</span>,
              connected: true,
            },
          ]).map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                setExternalTab(tool.id)
                setShowExternalImport(true)
              }}
              className="group flex flex-col rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-emerald-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-emerald-600"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                  {tool.icon}
                </span>
                {tool.connected && (
                  <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{tool.label}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                {tool.description}
              </p>
              <p className="mt-3 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {tool.id === 'lovable' ? 'Vincular proyecto →' : 'Importar →'}
              </p>
            </button>
          ))}
        </div>
      </section>

      <ExternalToolImportModal
        projectId={projectId}
        isOpen={showExternalImport}
        initialTab={externalTab}
        connectedTools={connectedTools}
        onClose={() => setShowExternalImport(false)}
        onImported={() => refreshArtifactsWithThumbs()}
      />

      {/* Artefactos Camino A */}
      <div className="mt-8">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Diseños generados
        </h3>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Artefactos del <span className="font-medium text-gray-700 dark:text-gray-300">Camino A</span>. Después de
          revisarlos, usa el <span className="font-medium text-gray-700 dark:text-gray-300">Camino B</span> para alinear
          sistema de diseño y flujos.
        </p>
        {artifacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-8 text-center dark:border-gray-600 dark:bg-gray-900/40">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aún no hay pantallas generadas. Completa el formulario del{' '}
              <span className="font-medium text-gray-800 dark:text-gray-200">Camino A</span> para crear wireframes o
              mockups guardados en este proyecto.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {artifacts.map((artifact) => (
              <Link
                key={artifact.id}
                href={`/projects/${projectId}/designs/${artifact.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 transition-colors hover:border-violet-300 hover:bg-gray-50 dark:hover:bg-gray-800 sm:px-4 sm:py-3"
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
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-100 text-xl dark:from-violet-950 dark:to-indigo-950">
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
