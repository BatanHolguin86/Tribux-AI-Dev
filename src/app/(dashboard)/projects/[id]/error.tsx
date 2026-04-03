'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Project error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <svg className="mb-4 h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <h2 className="text-lg font-display font-semibold text-gray-900">Error al cargar el proyecto</h2>
      <p className="mt-1 text-sm text-gray-500">No se pudo cargar la informacion del proyecto.</p>
      <div className="mt-4 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A1F33]"
        >
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  )
}
