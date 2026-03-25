'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          backgroundColor: '#0f0f11',
          color: '#e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 1rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            Algo salio mal
          </h1>
          <p style={{ fontSize: 14, color: '#a1a1aa', marginTop: 8, lineHeight: 1.5 }}>
            Ocurrio un error critico. Si el problema persiste, contacta a soporte.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 500,
              color: '#fff',
              backgroundColor: '#7c3aed',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
