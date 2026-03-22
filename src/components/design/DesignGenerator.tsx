'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { DesignWorkflowContext } from '@/lib/ai/context-builder'
import { DESIGN_TEMPLATES } from '@/lib/ai/agents/ui-ux-designer'
import {
  buildDesignToolInitialUserMessage,
  getDesignToolFlowForUi,
} from '@/lib/design/design-tool-workflow'
import { DesignChat } from './DesignChat'

type Artifact = {
  id: string
  title: string
  document_type: string
  status: string
  created_at: string
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
}

export function DesignGenerator({
  projectId,
  existingArtifacts,
  workflowContext,
}: DesignGeneratorProps) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>(existingArtifacts)
  const [screensInput, setScreensInput] = useState('')
  const [type, setType] = useState<'wireframe' | 'mockup_lowfi' | 'mockup_highfi'>('wireframe')
  const [refinement, setRefinement] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

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
      if (listRes.ok) {
        const json = await listRes.json()
        if (Array.isArray(json.artifacts)) {
          setArtifacts(json.artifacts.map((a: Record<string, string>) => ({
            id: a.id,
            title: a.screen_name || a.title || '',
            document_type: a.type || a.document_type || '',
            status: a.status,
            created_at: a.created_at,
          })))
        }
      }
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
          aria-label="Volver a plantillas"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a herramientas
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-lg">
              {resolvedTemplate.icon}
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                CTO + UI/UX Designer
              </p>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{resolvedTemplate.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{resolvedTemplate.description}</p>
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-3 rounded-lg border border-violet-200/80 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-violet-800 shadow-sm ring-1 ring-violet-200 dark:bg-gray-900 dark:text-violet-200 dark:ring-violet-800">
              1 · Alineacion CTO
            </span>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-fuchsia-800 shadow-sm ring-1 ring-fuchsia-200 dark:bg-gray-900 dark:text-fuchsia-200 dark:ring-fuchsia-800">
              2 · Entrega UI/UX
            </span>
          </div>
          <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">{flow.ctoAlignment}</p>
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400">
              Flujo de uso
            </p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-xs text-gray-600 dark:text-gray-400">
              {flow.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-800 dark:text-gray-200">Entregable:</span> {flow.uxDeliverable}
          </p>
          <details className="rounded-md border border-gray-200 bg-white/80 p-3 text-xs dark:border-gray-700 dark:bg-gray-900/60">
            <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">
              Contexto Discovery / producto (inyectado al agente)
            </summary>
            <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-400">
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
                  Aun no hay secciones <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">personas</code> o{' '}
                  <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">value_proposition</code> aprobadas en
                  Phase 00. Completa Discovery para mejores resultados.
                </li>
              )}
            </ul>
          </details>
        </div>

        <div className="h-[var(--content-height)] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <DesignChat projectId={projectId} threadId={threadId} initialPrompt={composedInitialPrompt} />
        </div>
      </div>
    )
  }

  // Template selection view
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">UI/UX Design Generator</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Genera wireframes y mockups desde specs KIRO, y usa las <strong>6 herramientas</strong> con flujo explícito{' '}
          <strong>CTO + UI/UX</strong> (alineación de valor y personas → entregable de diseño). Cada tarjeta abre un
          hilo guiado; el contexto de Discovery (personas y propuesta de valor) se inyecta automáticamente.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-xs leading-relaxed text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
        <span className="font-semibold text-gray-800 dark:text-gray-200">Orden recomendado:</span> Wireframes → Style
        Guide / Component Library → User Flows → Responsive Specs. Puedes alternar según necesidad; dentro de cada
        herramienta el agente primero sintetiza la alineación CTO y luego produce el artefacto UI/UX.
      </div>

      {/* Simple form to generate designs from specs */}
      <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Generar diseños desde specs KIRO</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Escribe los nombres de las pantallas o flujos separados por coma (por ejemplo:
          &quot;Login, Dashboard principal, Detalle de presupuesto&quot;), elige el tipo de diseño y
          opcionalmente añade instrucciones de refinamiento.
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
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm dark:shadow-gray-900/20 transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              {isGenerating ? 'Generando...' : 'Generar diseños'}
            </button>
          </div>
        </div>
      </div>

      {/* Error display for template actions */}
      {generateError && !screensInput.trim() && (
        <div className="mb-4 rounded-md border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {generateError}
        </div>
      )}

      {/* Templates grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DESIGN_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            title={`Abrir flujo CTO + UI/UX: ${tmpl.title}`}
            onClick={() => handleSelectTemplate(tmpl.id)}
            className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 text-left transition-all hover:border-violet-300 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20 text-lg">
              {tmpl.icon}
            </span>
            <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{tmpl.title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tmpl.description}</p>
          </button>
        ))}

        {/* Custom design card */}
        <button
          type="button"
          title="Flujo CTO + UI/UX con peticion libre"
          onClick={() => handleSelectTemplate('custom')}
          className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-5 text-left transition-all hover:border-violet-300 hover:bg-white dark:hover:bg-gray-900"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-lg">
            ✏️
          </span>
          <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">Diseno Custom</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Describe lo que necesitas al UI/UX Designer.</p>
        </button>
      </div>

      {/* Existing artifacts */}
      {artifacts.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Disenos generados
          </h3>
          <div className="space-y-2">
            {artifacts.map((artifact) => (
              <Link
                key={artifact.id}
                href={`/projects/${projectId}/designs/${artifact.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 transition-colors hover:border-violet-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">🎨</span>
                  <div>
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
        </div>
      )}
    </div>
  )
}
