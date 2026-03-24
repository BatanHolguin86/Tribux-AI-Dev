'use client'

import Link from 'next/link'

type Phase04ResourceBarProps = {
  projectId: string
}

export function Phase04ResourceBar({ projectId }: Phase04ResourceBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs dark:border-gray-700 dark:bg-gray-900">
      <span className="font-medium text-gray-500 dark:text-gray-400">Referencias en la app</span>
      <Link
        href={`/projects/${projectId}/phase/01`}
        className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
      >
        Phase 01 — KIRO
      </Link>
      <span className="hidden text-gray-300 sm:inline dark:text-gray-600" aria-hidden>
        ·
      </span>
      <Link
        href={`/projects/${projectId}/designs`}
        className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
      >
        Diseño &amp; UX
      </Link>
    </div>
  )
}
