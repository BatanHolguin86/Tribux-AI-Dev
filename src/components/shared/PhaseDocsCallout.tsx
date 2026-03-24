'use client'

type RepoPathLine = {
  label: string
  path: string
}

type PhaseDocsCalloutProps = {
  title: string
  description?: string
  repoPaths: RepoPathLine[]
  commands?: string[]
}

/**
 * In-app pointer to markdown docs that live in the repository (not served as URLs).
 */
export function PhaseDocsCallout({
  title,
  description,
  repoPaths,
  commands,
}: PhaseDocsCalloutProps) {
  return (
    <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/90 px-4 py-3 text-sm dark:border-violet-800 dark:bg-violet-950/35">
      <p className="font-medium text-violet-900 dark:text-violet-100">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{description}</p>
      )}
      <ul className="mt-2 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
        {repoPaths.map((p) => (
          <li key={p.path}>
            <span className="text-gray-500 dark:text-gray-400">{p.label}: </span>
            <code className="rounded bg-white/90 px-1.5 py-0.5 font-mono text-[11px] text-gray-900 dark:bg-gray-900/90 dark:text-gray-100">
              {p.path}
            </code>
          </li>
        ))}
      </ul>
      {commands && commands.length > 0 && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Comandos: </span>
          <code className="font-mono text-[11px] text-gray-800 dark:text-gray-200">
            {commands.join(' · ')}
          </code>
        </p>
      )}
    </div>
  )
}
