'use client'

import { useState } from 'react'

type ThreadItemProps = {
  id: string
  title: string | null
  messageCount: number
  lastMessageAt: string
  isActive: boolean
  onClick: () => void
  onDelete: (id: string) => void
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'ahora'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('es-LA', { month: 'short', day: 'numeric' })
}

export function ThreadItem({
  id,
  title,
  messageCount,
  lastMessageAt,
  isActive,
  onClick,
  onDelete,
}: ThreadItemProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div
      className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
        isActive ? 'bg-violet-50 text-violet-700' : 'hover:bg-gray-50'
      }`}
    >
      <button onClick={onClick} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">
          {title || 'Sin titulo'}
        </p>
        <p className="text-xs text-gray-400">
          {messageCount} msgs · {formatRelative(lastMessageAt)}
        </p>
      </button>

      {showConfirm ? (
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => { onDelete(id); setShowConfirm(false) }}
            className="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
          >
            Si
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="shrink-0 rounded p-1 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          title="Eliminar"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}
