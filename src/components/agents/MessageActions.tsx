'use client'

import { useState } from 'react'
import { ApplyToRepoButton } from './ApplyToRepoButton'
import { ApplyToSupabaseButton } from './ApplyToSupabaseButton'

type MessageActionsProps = {
  content: string
  projectId: string
  repoUrl?: string | null
  supabaseProjectRef?: string | null
  onSaveArtifact: (content: string) => void
}

export function MessageActions({ content, projectId, repoUrl, supabaseProjectRef, onSaveArtifact }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [savingKB, setSavingKB] = useState(false)
  const [savedKB, setSavedKB] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveToKB() {
    setSavingKB(true)
    try {
      // Extract a title from the first line or first 60 chars
      const firstLine = content.split('\n').find((l) => l.trim())?.replace(/^#+\s*/, '').trim() ?? ''
      const title = firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine || 'Nota de agente'

      const res = await fetch(`/api/projects/${projectId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: 'decisiones',
          content,
        }),
      })

      if (res.ok) {
        setSavedKB(true)
        setTimeout(() => setSavedKB(false), 3000)
      }
    } catch {
      // silently fail
    }
    setSavingKB(false)
  }

  return (
    <div className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        onClick={handleCopy}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        title="Copiar al portapapeles"
      >
        {copied ? (
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      <button
        onClick={() => onSaveArtifact(content)}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        title="Guardar como artifact"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      </button>
      {repoUrl && (
        <ApplyToRepoButton
          content={content}
          projectId={projectId}
          repoUrl={repoUrl}
        />
      )}
      {supabaseProjectRef && (
        <ApplyToSupabaseButton
          content={content}
          projectId={projectId}
          supabaseProjectRef={supabaseProjectRef}
        />
      )}
      <button
        onClick={handleSaveToKB}
        disabled={savingKB || savedKB}
        className={`rounded p-1 transition-colors ${
          savedKB
            ? 'text-emerald-500'
            : 'text-gray-400 hover:bg-gray-100 hover:text-violet-600 dark:hover:bg-gray-800 dark:hover:text-violet-400'
        } disabled:opacity-50`}
        title={savedKB ? 'Guardado en Base de Conocimiento' : 'Guardar en Base de Conocimiento'}
      >
        {savedKB ? (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )}
      </button>
    </div>
  )
}
