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

  // Active chat view
  if (activeTemplate && threadId && resolvedTemplate) {
    return (
      <div>
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a templates
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-lg">
              {resolvedTemplate.icon}
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{resolvedTemplate.title}</h2>
              <p className="text-sm text-gray-500">{resolvedTemplate.description}</p>
            </div>
          </div>
        </div>

        <div className="h-[calc(100vh-18rem)] rounded-lg border border-gray-200 bg-white">
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
        <h2 className="text-lg font-bold text-gray-900">UI/UX Design Generator</h2>
        <p className="mt-1 text-sm text-gray-500">
          Genera wireframes, componentes y guias de estilo basados en los specs KIRO de tu proyecto.
        </p>
      </div>

      {/* Templates grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DESIGN_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => handleSelectTemplate(tmpl.id)}
            className="rounded-lg border-2 border-gray-200 bg-white p-5 text-left transition-all hover:border-violet-300 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-lg">
              {tmpl.icon}
            </span>
            <h3 className="mt-3 font-semibold text-gray-900">{tmpl.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{tmpl.description}</p>
          </button>
        ))}

        {/* Custom design card */}
        <button
          onClick={() => handleSelectTemplate('custom')}
          className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-left transition-all hover:border-violet-300 hover:bg-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg">
            ✏️
          </span>
          <h3 className="mt-3 font-semibold text-gray-900">Diseno Custom</h3>
          <p className="mt-1 text-sm text-gray-500">Describe lo que necesitas al UI/UX Designer.</p>
        </button>
      </div>

      {/* Existing artifacts */}
      {existingArtifacts.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Artifacts guardados
          </h3>
          <div className="space-y-2">
            {existingArtifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">🎨</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{artifact.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(artifact.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  artifact.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
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
