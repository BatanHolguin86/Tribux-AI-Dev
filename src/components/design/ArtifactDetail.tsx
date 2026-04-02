'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { DesignStatus, DesignType, DesignSource } from '@/types/design'
import { DESIGN_KIT_NEXT_STEPS } from '@/lib/design/design-tool-workflow'

type ArtifactDetailProps = {
  projectId: string
  artifact: {
    id: string
    type: DesignType
    screen_name: string
    status: DesignStatus
    source?: DesignSource
    external_url?: string | null
    created_at: string
  }
  content: string | null
}

const SOURCE_BADGES: Record<string, { label: string; cls: string }> = {
  figma: { label: 'Figma', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  v0: { label: 'V0', cls: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' },
  lovable: { label: 'Lovable', cls: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
}

const TYPE_LABELS: Record<DesignType, string> = {
  wireframe: 'Wireframe',
  mockup_lowfi: 'Mockup Low-Fi',
  mockup_highfi: 'Mockup High-Fi',
}

const STATUS_LABELS: Record<DesignStatus, string> = {
  generating: 'Generando...',
  draft: 'Borrador',
  approved: 'Aprobado',
}

const DEVICE_SIZES = {
  mobile: { width: 375, label: 'Mobile' },
  tablet: { width: 768, label: 'Tablet' },
  desktop: { width: 1280, label: 'Desktop' },
} as const

type DeviceSize = keyof typeof DEVICE_SIZES

export function ArtifactDetail({ projectId, artifact, content }: ArtifactDetailProps) {
  const router = useRouter()
  const [status, setStatus] = useState<DesignStatus>(artifact.status)
  const [refineInput, setRefineInput] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [displayContent, setDisplayContent] = useState(content ?? '')
  const [isApproving, setIsApproving] = useState(false)
  const [device, setDevice] = useState<DeviceSize>('mobile')
  const [iframeHeight, setIframeHeight] = useState(800)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const isHtml = displayContent.trim().startsWith('<!DOCTYPE') || displayContent.trim().startsWith('<html')

  // Auto-resize iframe to content height
  useEffect(() => {
    if (!isHtml || !iframeRef.current) return

    function handleLoad() {
      try {
        const doc = iframeRef.current?.contentDocument
        if (doc?.body) {
          setIframeHeight(Math.max(doc.body.scrollHeight + 40, 400))
        }
      } catch {
        // cross-origin iframe, use default height
      }
    }

    const iframe = iframeRef.current
    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [isHtml, displayContent])

  async function handleApprove() {
    setIsApproving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/designs/${artifact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      if (res.ok) {
        setStatus('approved')
      }
    } finally {
      setIsApproving(false)
    }
  }

  async function handleRefine() {
    if (!refineInput.trim()) return
    setIsRefining(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/designs/${artifact.id}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: refineInput }),
      })

      if (!res.ok) return

      setStatus('draft')
      setRefineInput('')
      router.refresh()
    } finally {
      setIsRefining(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/phase/02`}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            &larr; Diseño &amp; UX (Phase 02)
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{artifact.screen_name}</h1>
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
            {TYPE_LABELS[artifact.type]}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              status === 'approved'
                ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : status === 'generating'
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {STATUS_LABELS[status]}
          </span>
          {artifact.source && artifact.source !== 'internal' && SOURCE_BADGES[artifact.source] && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_BADGES[artifact.source].cls}`}>
              {SOURCE_BADGES[artifact.source].label}
            </span>
          )}
          {artifact.external_url && (
            <a
              href={artifact.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-600 underline hover:text-violet-700 dark:text-violet-400"
            >
              Abrir original →
            </a>
          )}
        </div>

        {status !== 'approved' && (
          <button
            onClick={handleApprove}
            disabled={isApproving || status === 'generating'}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isApproving ? 'Aprobando...' : 'Aprobar diseno'}
          </button>
        )}
      </div>

      {/* Device controls */}
      {isHtml && displayContent && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1">
            {(Object.keys(DEVICE_SIZES) as DeviceSize[]).map((key) => (
              <button
                key={key}
                onClick={() => setDevice(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  device === key
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {DEVICE_SIZES[key].label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {DEVICE_SIZES[device].width}px
          </span>
        </div>
      )}

      {/* CTA: align generated visual with the 6 design-kit tools */}
      {displayContent && status !== 'generating' && (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Siguiente paso: sistema de diseño (CTO + UI/UX)
          </h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Este artefacto viene del <strong>Camino A</strong> (pantallas visuales). Para alinear{' '}
            <strong>Component Library</strong>, <strong>Style Guide</strong>, <strong>User Flows</strong> y{' '}
            <strong>Responsive Specs</strong> con tus <strong>personas</strong> y <strong>propuesta de valor</strong>,
            vuelve al hub y usa el <strong>Camino B</strong>: cada herramienta abre una conversación guiada (síntesis CTO
            + entrega UI/UX).
          </p>
          <ul className="mt-2 grid gap-1 text-xs text-gray-700 dark:text-gray-300 sm:grid-cols-2">
            {DESIGN_KIT_NEXT_STEPS.map((step) => (
              <li key={step.id} className="flex items-center gap-1.5">
                <span className="text-violet-600 dark:text-violet-400">→</span>
                {step.label}
              </li>
            ))}
          </ul>
          <Link
            href={`/projects/${projectId}/designs`}
            className="mt-3 inline-flex text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            Ir a Diseño &amp; UX (hub) →
          </Link>
        </div>
      )}

      {/* Content display */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {displayContent ? (
          isHtml ? (
            <div className="flex justify-center p-4 overflow-x-auto" style={{ minHeight: 400 }}>
              <div
                className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
                style={{ width: DEVICE_SIZES[device].width, maxWidth: '100%' }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={displayContent}
                  className="w-full border-0"
                  style={{ height: iframeHeight }}
                  sandbox="allow-scripts"
                  title="Design preview"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
                {displayContent}
              </pre>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center p-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {status === 'generating' ? 'Generando diseno...' : 'Sin contenido disponible.'}
            </p>
          </div>
        )}
      </div>

      {/* Refine section */}
      {status !== 'approved' && displayContent && (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Refinar diseno</h3>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Describe los cambios que quieres y se regenerara el diseno visual.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              placeholder="Ej: Cambia el boton a azul, agrega un sidebar, hazlo mas minimalista..."
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              disabled={isRefining}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleRefine()
                }
              }}
            />
            <button
              onClick={handleRefine}
              disabled={isRefining || !refineInput.trim()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              {isRefining ? 'Refinando...' : 'Refinar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
