'use client'

import { useState } from 'react'
import { extractCodeFiles, type ExtractedFile } from '@/lib/ai/code-extractor'

type ApplyToRepoButtonProps = {
  content: string
  projectId: string
  repoUrl: string
}

export function ApplyToRepoButton({ content, projectId, repoUrl }: ApplyToRepoButtonProps) {
  const [expanded, setExpanded] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<{ url: string; filesChanged: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const files = extractCodeFiles(content)

  if (files.length === 0 || !repoUrl) return null

  // Auto-generate commit message from first file
  if (!commitMessage && files.length > 0) {
    const firstPath = files[0].path
    const dir = firstPath.split('/').slice(0, -1).join('/')
    const defaultMsg = `feat: add ${files.length === 1 ? firstPath : `${files.length} files in ${dir || '/'}`}`
    // Set lazily on first render
    if (!commitMessage) {
      setTimeout(() => setCommitMessage(defaultMsg), 0)
    }
  }

  async function handleApply() {
    setApplying(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/commits/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map((f: ExtractedFile) => ({ path: f.path, content: f.content })),
          commitMessage,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Error al aplicar al repositorio')
        return
      }

      setResult({ url: data.url, filesChanged: data.filesChanged })
      setExpanded(false)
    } catch {
      setError('Error de conexion')
    } finally {
      setApplying(false)
    }
  }

  if (result) {
    return (
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/50"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {result.filesChanged} archivo{result.filesChanged > 1 ? 's' : ''} aplicado{result.filesChanged > 1 ? 's' : ''} — ver commit
      </a>
    )
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-surface px-3 py-1.5 text-xs font-medium text-brand-primary ring-1 ring-[#0EA5A3]/30 transition-colors hover:bg-brand-surface dark:bg-brand-primary/20 dark:text-brand-teal dark:ring-[#0F2B46]/50"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Aplicar {files.length} archivo{files.length > 1 ? 's' : ''} al repo
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-brand-teal/30 bg-brand-surface/50 p-3 dark:border-brand-primary/50 dark:bg-brand-primary/10">
      <div className="mb-2 text-xs font-medium text-brand-primary dark:text-brand-teal">
        Archivos a aplicar:
      </div>
      <ul className="mb-3 space-y-1">
        {files.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-800">
              {f.language}
            </span>
            <span className="font-mono">{f.path}</span>
          </li>
        ))}
      </ul>

      <input
        type="text"
        value={commitMessage}
        onChange={(e) => setCommitMessage(e.target.value)}
        placeholder="Mensaje de commit..."
        className="mb-2 w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
      />

      {error && (
        <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setExpanded(false)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Cancelar
        </button>
        <button
          onClick={handleApply}
          disabled={applying || !commitMessage.trim()}
          className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-navy disabled:opacity-50"
        >
          {applying ? 'Aplicando...' : 'Confirmar y aplicar'}
        </button>
      </div>
    </div>
  )
}
