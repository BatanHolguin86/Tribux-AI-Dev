'use client'

import { useState } from 'react'
import { MiniAgentDrawer } from './MiniAgentDrawer'

type FloatingAgentButtonProps = {
  projectId: string
}

export function FloatingAgentButton({ projectId }: FloatingAgentButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-navy"
        title="Chat con agentes"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {open && (
        <MiniAgentDrawer
          projectId={projectId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
