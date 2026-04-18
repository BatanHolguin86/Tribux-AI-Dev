'use client'

import { useState } from 'react'
import { IntegrationSetupInline } from './IntegrationSetupInline'

type ExternalTab = 'figma' | 'v0' | 'lovable'

type FigmaFrame = { node_id: string; name: string; page: string }

type ExternalToolImportModalProps = {
  projectId: string
  isOpen: boolean
  initialTab: ExternalTab
  connectedTools: { figma: boolean; v0: boolean }
  onClose: () => void
  onImported: () => void
}

export function ExternalToolImportModal({
  projectId,
  isOpen,
  initialTab,
  connectedTools,
  onClose,
  onImported,
}: ExternalToolImportModalProps) {
  const [activeTab, setActiveTab] = useState<ExternalTab>(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Figma state
  const [figmaUrl, setFigmaUrl] = useState('')
  const [figmaFrames, setFigmaFrames] = useState<FigmaFrame[]>([])
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set())
  const [figmaConnected, setFigmaConnected] = useState(connectedTools.figma)

  // V0 state
  const [v0Content, setV0Content] = useState('')
  const [v0ScreenName, setV0ScreenName] = useState('')
  const [v0SourceUrl, setV0SourceUrl] = useState('')

  // Lovable state
  const [lovableUrl, setLovableUrl] = useState('')
  const [lovableScreenName, setLovableScreenName] = useState('')

  // Shared
  const [designType, setDesignType] = useState<'wireframe' | 'mockup_lowfi' | 'mockup_highfi'>('mockup_lowfi')

  if (!isOpen) return null

  function resetState() {
    setError(null)
    setSuccess(null)
  }

  // ── Figma handlers ─────────────────────────────────────────────────────────
  async function handleFetchFrames() {
    resetState()
    setLoading(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/designs/import/figma/frames?url=${encodeURIComponent(figmaUrl)}`,
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Error al cargar frames')
      setFigmaFrames(data.frames ?? [])
      setSelectedFrames(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  function toggleFrame(nodeId: string) {
    setSelectedFrames((prev) => {
      const next = new Set(prev)
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId)
      return next
    })
  }

  async function handleImportFigma() {
    resetState()
    setLoading(true)
    try {
      const frames = figmaFrames.filter((f) => selectedFrames.has(f.node_id))
      const res = await fetch(`/api/projects/${projectId}/designs/import/figma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figma_url: figmaUrl,
          selected_frames: frames.map((f) => ({ node_id: f.node_id, name: f.name })),
          type: designType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Error al importar')
      setSuccess(`${data.count} frame(s) importados`)
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  // ── V0 handlers ────────────────────────────────────────────────────────────
  async function handleImportV0() {
    resetState()
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/designs/import/v0`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: v0Content,
          screen_name: v0ScreenName,
          type: designType,
          source_url: v0SourceUrl || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Error al importar')
      setSuccess('Componente V0 importado')
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  // ── Lovable handlers ───────────────────────────────────────────────────────
  async function handleImportLovable() {
    resetState()
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/designs/import/lovable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lovable_url: lovableUrl,
          screen_name: lovableScreenName,
          type: designType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Error al vincular')
      setSuccess('Proyecto Lovable vinculado')
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const TABS: { id: ExternalTab; label: string; icon: string }[] = [
    { id: 'figma', label: 'Figma', icon: '🎨' },
    { id: 'v0', label: 'V0', icon: '⚡' },
    { id: 'lovable', label: 'Lovable', icon: '💜' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Importar desde herramienta externa
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); resetState() }}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-brand-teal text-brand-primary dark:text-brand-teal'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Status messages */}
          {error && (
            <div className="mb-4 rounded-md border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-md border-l-4 border-green-500 bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
              {success}
            </div>
          )}

          {/* Design type selector (shared) */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Tipo</label>
            <div className="flex gap-2">
              {(['wireframe', 'mockup_lowfi', 'mockup_highfi'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDesignType(t)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    designType === t
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {t === 'wireframe' ? 'Wireframe' : t === 'mockup_lowfi' ? 'Mockup Low-Fi' : 'Mockup High-Fi'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Figma Tab ────────────────────────────────────────────────── */}
          {activeTab === 'figma' && (
            <div className="space-y-4">
              <IntegrationSetupInline
                projectId={projectId}
                provider="figma"
                isConnected={figmaConnected}
                onConnected={() => setFigmaConnected(true)}
              />

              {figmaConnected && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      URL del archivo Figma
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={figmaUrl}
                        onChange={(e) => setFigmaUrl(e.target.value)}
                        placeholder="https://www.figma.com/design/..."
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                      <button
                        onClick={handleFetchFrames}
                        disabled={loading || !figmaUrl.trim()}
                        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
                      >
                        {loading ? '...' : 'Cargar frames'}
                      </button>
                    </div>
                  </div>

                  {figmaFrames.length > 0 && (
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Selecciona frames ({selectedFrames.size} seleccionados)
                      </label>
                      <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                        {figmaFrames.map((frame) => (
                          <label
                            key={frame.node_id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFrames.has(frame.node_id)}
                              onChange={() => toggleFrame(frame.node_id)}
                              className="rounded border-gray-300 text-brand-primary focus:ring-[#0EA5A3]"
                            />
                            <span className="text-gray-900 dark:text-gray-100">{frame.name}</span>
                            <span className="text-xs text-gray-400">{frame.page}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── V0 Tab ───────────────────────────────────────────────────── */}
          {activeTab === 'v0' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Nombre de la pantalla
                </label>
                <input
                  type="text"
                  value={v0ScreenName}
                  onChange={(e) => setV0ScreenName(e.target.value)}
                  placeholder="Dashboard, Login, etc."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Codigo generado en V0 (HTML o React+Tailwind)
                </label>
                <textarea
                  value={v0Content}
                  onChange={(e) => setV0Content(e.target.value)}
                  placeholder="Pega aqui el codigo de V0..."
                  rows={8}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  URL de V0 (opcional)
                </label>
                <input
                  type="url"
                  value={v0SourceUrl}
                  onChange={(e) => setV0SourceUrl(e.target.value)}
                  placeholder="https://v0.dev/t/..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {/* ── Lovable Tab ──────────────────────────────────────────────── */}
          {activeTab === 'lovable' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  URL del proyecto Lovable
                </label>
                <input
                  type="url"
                  value={lovableUrl}
                  onChange={(e) => setLovableUrl(e.target.value)}
                  placeholder="https://lovable.dev/projects/..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Nombre de referencia
                </label>
                <input
                  type="text"
                  value={lovableScreenName}
                  onChange={(e) => setLovableScreenName(e.target.value)}
                  placeholder="Prototipo principal, MVP, etc."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cerrar
          </button>
          <button
            onClick={
              activeTab === 'figma'
                ? handleImportFigma
                : activeTab === 'v0'
                  ? handleImportV0
                  : handleImportLovable
            }
            disabled={
              loading ||
              (activeTab === 'figma' && (selectedFrames.size === 0 || !figmaConnected)) ||
              (activeTab === 'v0' && (!v0Content.trim() || !v0ScreenName.trim())) ||
              (activeTab === 'lovable' && (!lovableUrl.trim() || !lovableScreenName.trim()))
            }
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy disabled:opacity-50"
          >
            {loading
              ? 'Procesando...'
              : activeTab === 'figma'
                ? `Importar ${selectedFrames.size} frame(s)`
                : activeTab === 'v0'
                  ? 'Importar de V0'
                  : 'Vincular Lovable'}
          </button>
        </div>
      </div>
    </div>
  )
}
