'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: 'var(--font-inter)',
        },
        className: 'text-sm',
      }}
      richColors
      closeButton
    />
  )
}
