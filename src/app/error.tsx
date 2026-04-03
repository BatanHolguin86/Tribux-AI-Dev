'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <svg className="mb-4 h-16 w-16 text-red-400 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Algo salio mal</h2>
      <p className="mt-2 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
        Ocurrio un error inesperado. Si el problema persiste, contacta a soporte.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-[#0F2B46] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33]"
      >
        Reintentar
      </button>
    </div>
  )
}
