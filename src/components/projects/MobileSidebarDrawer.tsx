'use client'

import { useState, useEffect } from 'react'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import type { PhaseStatus } from '@/types/project'
import { PhasesStepper } from './PhasesStepper'
import { ProjectTools } from './ProjectTools'
import { ProactiveSuggestions } from './ProactiveSuggestions'

type MobileSidebarDrawerProps = {
  projectId: string
  phases: Array<{ phase_number: number; status: PhaseStatus }>
  currentPhase: number
}

export function MobileSidebarDrawer({ projectId, phases, currentPhase }: MobileSidebarDrawerProps) {
  const [open, setOpen] = useState(false)
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  return (
    <>
      {/* Floating toggle button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 transition-transform hover:scale-105 lg:hidden"
        aria-label="Abrir menu de fases y herramientas"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Drawer overlay + panel */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white dark:bg-gray-900 shadow-xl dark:shadow-black/30 p-5 space-y-5"
          >
            {/* Close button */}
            <div className="flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                aria-label="Cerrar menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sidebar content — same as desktop */}
            <div onClick={() => setOpen(false)}>
              <PhasesStepper projectId={projectId} phases={phases} />
            </div>
            <div onClick={() => setOpen(false)}>
              <ProjectTools projectId={projectId} />
            </div>
            <div onClick={() => setOpen(false)}>
              <ProactiveSuggestions projectId={projectId} phases={phases} currentPhase={currentPhase} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
