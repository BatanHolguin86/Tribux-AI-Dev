'use client'

import { createContext, useContext } from 'react'

export type PhaseTab = 'secciones' | 'equipo' | 'herramientas'

export type PhaseWorkspaceNav = {
  goToSecciones: () => void
  goToEquipo: () => void
  goToHerramientas: () => void
  activeTab: PhaseTab
}

export const PhaseWorkspaceNavContext = createContext<PhaseWorkspaceNav | null>(null)

export function usePhaseWorkspaceNav(): PhaseWorkspaceNav | null {
  return useContext(PhaseWorkspaceNavContext)
}
