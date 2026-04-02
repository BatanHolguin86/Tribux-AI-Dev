'use client'

import { useEffect, useState, useRef } from 'react'

type PreviewData = {
  status: string
  url?: string
  branch?: string
  type?: 'preview' | 'production'
}

const DEVICE_SIZES = {
  mobile: { width: 375, label: '📱' },
  tablet: { width: 768, label: '📟' },
  desktop: { width: '100%', label: '🖥️' },
} as const

type DeviceSize = keyof typeof DEVICE_SIZES

export function LivePreviewWidget({
  projectId,
  activeBranch,
}: {
  projectId: string
  activeBranch?: string | null
}) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [device, setDevice] = useState<DeviceSize>('mobile')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchPreview() {
    try {
      const params = activeBranch ? `?branch=${encodeURIComponent(activeBranch)}` : ''
      const res = await fetch(`/api/projects/${projectId}/phases/4/preview${params}`)
      if (res.ok) {
        const data = await res.json()
        setPreview(data)

        // Stop polling once we have a URL
        if (data.url && intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch { /* non-fatal */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPreview()
    intervalRef.current = setInterval(fetchPreview, 15000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, activeBranch])

  // Restart polling when branch changes
  useEffect(() => {
    if (activeBranch) {
      setLoading(true)
      setPreview(null)
      fetchPreview()
      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchPreview, 15000)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch])

  if (loading && !preview) return null
  if (!preview?.url) {
    if (preview?.status === 'no_repo' || preview?.status === 'no_deployment') return null
    return null
  }

  const deviceWidth = DEVICE_SIZES[device].width

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
            Preview en vivo
          </span>
          {preview.type === 'preview' && preview.branch && (
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              {preview.branch}
            </span>
          )}
          {preview.type === 'production' && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              prod
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Device toggles */}
          {expanded && (
            <div className="flex gap-0.5">
              {(Object.entries(DEVICE_SIZES) as [DeviceSize, { label: string }][]).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setDevice(key)}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    device === key
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-600 underline hover:text-violet-700 dark:text-violet-400"
          >
            Abrir →
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <svg className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* iframe preview */}
      {expanded && (
        <div className="flex justify-center bg-gray-50 p-4 dark:bg-gray-950">
          <div
            style={{ width: typeof deviceWidth === 'number' ? `${deviceWidth}px` : deviceWidth }}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700"
          >
            <iframe
              src={preview.url}
              className="h-[500px] w-full"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="Live Preview"
            />
          </div>
        </div>
      )}
    </div>
  )
}
