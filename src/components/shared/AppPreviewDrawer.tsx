'use client'

import { useState, useEffect } from 'react'
import { useFounderMode } from '@/hooks/useFounderMode'

type DeviceSize = 'mobile' | 'tablet' | 'desktop'

const DEVICES: Record<DeviceSize, { width: number | string; label: string; icon: string }> = {
  mobile: { width: 375, label: 'Mobile', icon: '📱' },
  tablet: { width: 768, label: 'Tablet', icon: '📟' },
  desktop: { width: '100%', label: 'Desktop', icon: '🖥️' },
}

type PreviewData = {
  status: string
  url?: string
  type?: string
}

type RepoFile = {
  path: string
  type: string
}

export function AppPreviewDrawer({
  projectId,
  repoUrl,
}: {
  projectId: string
  repoUrl: string | null
}) {
  const { hideCode } = useFounderMode()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [device, setDevice] = useState<DeviceSize>('desktop')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [files, setFiles] = useState<RepoFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [loadingFile, setLoadingFile] = useState(false)

  // Don't render if no repo
  if (!repoUrl) return null

  // Fetch preview URL
  useEffect(() => {
    if (!open) return
    fetch(`/api/projects/${projectId}/phases/4/preview`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setPreview(data) })
      .catch(() => {})
  }, [open, projectId])

  // Fetch file tree
  useEffect(() => {
    if (!open || hideCode) return
    fetch(`/api/projects/${projectId}/infrastructure`)
      .then((r) => r.ok ? r.json() : null)
      .then(() => {
        // We'll use a simpler approach — just show key paths
        setFiles([
          { path: 'src/app/page.tsx', type: 'file' },
          { path: 'src/app/layout.tsx', type: 'file' },
          { path: 'src/app/globals.css', type: 'file' },
          { path: 'package.json', type: 'file' },
        ])
      })
      .catch(() => {})
  }, [open, projectId, hideCode])

  async function loadFile(path: string) {
    setLoadingFile(true)
    setSelectedFile(path)
    try {
      // Fetch file content from GitHub via our API
      const res = await fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`)
      if (res.ok) {
        const data = await res.json()
        setFileContent(data.content ?? '// No content')
      } else {
        setFileContent('// Error loading file')
      }
    } catch {
      setFileContent('// Error loading file')
    } finally {
      setLoadingFile(false)
    }
  }

  const deviceWidth = DEVICES[device].width

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-[#0EA5A3] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-[#0EA5A3]/25 transition-all hover:scale-105 hover:shadow-xl"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Ver mi app
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative ml-auto flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl dark:bg-[#0A1F33]" role="dialog" aria-modal="true">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3 dark:border-[#1E3A55]">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-sm font-bold text-[#0F2B46] dark:text-white">
                  {hideCode ? 'Preview de tu app' : 'Preview & Codigo'}
                </h2>
                {preview?.url && (
                  <span className="flex items-center gap-1.5 rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-medium text-[#10B981]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                    En vivo
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Tabs — hide code tab for founders */}
                {!hideCode && (
                  <div className="flex rounded-lg bg-[#F1F5F9] p-0.5 dark:bg-[#0F2B46]">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        activeTab === 'preview' ? 'bg-white text-[#0F2B46] shadow-sm dark:bg-[#1E3A55] dark:text-white' : 'text-[#94A3B8]'
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setActiveTab('code')}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        activeTab === 'code' ? 'bg-white text-[#0F2B46] shadow-sm dark:bg-[#1E3A55] dark:text-white' : 'text-[#94A3B8]'
                      }`}
                    >
                      Codigo
                    </button>
                  </div>
                )}

                {/* Device toggles */}
                {activeTab === 'preview' && (
                  <div className="flex gap-0.5">
                    {(Object.entries(DEVICES) as [DeviceSize, { icon: string }][]).map(([key, { icon }]) => (
                      <button
                        key={key}
                        onClick={() => setDevice(key)}
                        className={`rounded-md px-2 py-1 text-sm ${
                          device === key
                            ? 'bg-[#E8F4F8] text-[#0F2B46] dark:bg-[#0F2B46] dark:text-[#0EA5A3]'
                            : 'text-[#94A3B8]'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                )}

                {/* External link */}
                {preview?.url && (
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md px-2 py-1 text-xs text-[#0EA5A3] hover:bg-[#E8F4F8]"
                  >
                    Abrir ↗
                  </a>
                )}

                {/* Close */}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar preview"
                  className="rounded-md p-1.5 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F2B46] dark:hover:bg-[#0F2B46]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'preview' ? (
                <div className="flex h-full items-start justify-center bg-[#F1F5F9] p-4 dark:bg-[#071826]">
                  {preview?.url ? (
                    <div
                      className="h-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-lg dark:border-[#1E3A55]"
                      style={{ width: typeof deviceWidth === 'number' ? `${deviceWidth}px` : deviceWidth }}
                    >
                      <iframe
                        src={preview.url}
                        className="h-full w-full"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        title="App Preview"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl">🚧</div>
                        <p className="mt-3 font-display text-sm font-semibold text-[#0F2B46] dark:text-white">
                          Preview no disponible aun
                        </p>
                        <p className="mt-1 text-xs text-[#94A3B8]">
                          El preview estara disponible cuando el codigo se construya y se depliegue.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full">
                  {/* File tree */}
                  <div className="w-56 shrink-0 overflow-y-auto border-r border-[#E2E8F0] bg-[#F8FAFC] p-3 dark:border-[#1E3A55] dark:bg-[#0A1F33]">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Archivos</p>
                    <div className="space-y-0.5">
                      {files.map((file) => (
                        <button
                          key={file.path}
                          onClick={() => loadFile(file.path)}
                          className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                            selectedFile === file.path
                              ? 'bg-[#0EA5A3]/10 text-[#0EA5A3]'
                              : 'text-[#64748B] hover:bg-[#E8F4F8] dark:hover:bg-[#0F2B46]'
                          }`}
                        >
                          <span className="font-mono">{file.path.split('/').pop()}</span>
                          <span className="ml-1 text-[9px] text-[#94A3B8]">{file.path}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code view */}
                  <div className="flex-1 overflow-auto bg-[#0A1F33] p-4">
                    {selectedFile ? (
                      <div>
                        <p className="mb-2 text-xs text-[#94A3B8]">{selectedFile}</p>
                        {loadingFile ? (
                          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Cargando...
                          </div>
                        ) : (
                          <pre className="text-xs leading-relaxed text-gray-300">
                            <code>{fileContent}</code>
                          </pre>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[#94A3B8]">
                        Selecciona un archivo para ver su codigo
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
