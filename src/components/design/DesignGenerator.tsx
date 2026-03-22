'use client'

import { useState } from 'react'
import { DESIGN_TEMPLATES } from '@/lib/ai/agents/ui-ux-designer'
import { DesignChat } from './DesignChat'

type Artifact = {
  id: string
  title: string
  document_type: string
  status: string
  created_at: string
}

type DesignGeneratorProps = {
  projectId: string
  existingArtifacts: Artifact[]
}

export function DesignGenerator({ projectId, existingArtifacts }: DesignGeneratorProps) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>(existingArtifacts)
  const [screensInput, setScreensInput] = useState('')
  const [type, setType] = useState<'wireframe' | 'mockup_lowfi' | 'mockup_highfi'>('wireframe')
  const [refinement, setRefinement] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  async function handleSelectTemplate(templateId: string) {
    // Create a new thread with the UI/UX Designer agent
    const res = await fetch(`/api/projects/${projectId}/agents/ui_ux_designer/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Design: ${templateId}` }),
    })

    if (!res.ok) return

    const data = await res.json()
    setThreadId(data.id)
    setActiveTemplate(templateId)
  }

  function handleBack() {
    setActiveTemplate(null)
    setThreadId(null)
  }

  const template = DESIGN_TEMPLATES.find((t) => t.id === activeTemplate)
  const customTemplate = { id: 'custom', title: 'Diseno Custom', description: 'Describe lo que necesitas.', icon: '✏️', prompt: '' }
  const resolvedTemplate = template ?? (activeTemplate === 'custom' ? customTemplate : null)

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

      // Refresh artifact list
      const listRes = await fetch(`/api/projects/${projectId}/designs`)
      if (listRes.ok) {
        const json = (await listRes.json()) as { artifacts?: Artifact[] }
        if (Array.isArray(json.artifacts)) {
          setArtifacts(json.artifacts)
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
          Volver a templates
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-lg">
              {resolvedTemplate.icon}
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{resolvedTemplate.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{resolvedTemplate.description}</p>
            </div>
          </div>
        </div>

        <div className="h-[var(--content-height)] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <DesignChat
            projectId={projectId}
            threadId={threadId}
            initialPrompt={resolvedTemplate.prompt}
          />
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
          Genera wireframes, componentes y guias de estilo basados en los specs KIRO de tu proyecto.
        </p>
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

      {/* Templates grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DESIGN_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
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
            Artifacts guardados
          </h3>
          <div className="space-y-2">
            {artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">🎨</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{artifact.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(artifact.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  artifact.status === 'approved'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {artifact.status === 'approved' ? 'Aprobado' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
