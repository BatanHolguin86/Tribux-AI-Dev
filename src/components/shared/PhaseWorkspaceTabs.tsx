'use client'

import { useState, useCallback, useMemo } from 'react'
import type { AgentType } from '@/types/agent'
import {
  PhaseWorkspaceNavContext,
  type PhaseTab,
} from '@/lib/phase-workspace-nav-context'

export type { PhaseTab }

type PhaseWorkspaceTabsProps = {
  phaseNumber: number
  projectId: string
  hasTools?: boolean
  /** Agent types assigned to this phase (from phase-agents config) */
  phaseAgents: AgentType[]
  /** Content for the main Secciones tab */
  children: React.ReactNode
  /** Content for the Equipo tab — rendered by parent (receives goToSecciones) */
  teamContent: React.ReactNode | ((goToSecciones: () => void) => React.ReactNode)
  /** Content for the Herramientas tab — rendered by parent */
  toolsContent?: React.ReactNode
  /** Optional: initial tab override */
  initialTab?: PhaseTab
  /** Override Herramientas tab label/icon (e.g. Phase 02 — Diseño & UX) */
  toolsTabLabel?: string
  toolsTabIcon?: string
}

const TAB_CONFIG: Array<{ key: PhaseTab; label: string; icon: string }> = [
  { key: 'secciones', label: 'Secciones', icon: '📋' },
  { key: 'equipo', label: 'Equipo', icon: '🤖' },
  { key: 'herramientas', label: 'Herramientas', icon: '🛠️' },
]

export function PhaseWorkspaceTabs({
  hasTools = false,
  children,
  teamContent,
  toolsContent,
  initialTab = 'secciones',
  toolsTabLabel,
  toolsTabIcon,
}: PhaseWorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState<PhaseTab>(initialTab)

  const goToSecciones = useCallback(() => setActiveTab('secciones'), [])
  const goToEquipo = useCallback(() => setActiveTab('equipo'), [])
  const goToHerramientas = useCallback(() => {
    if (hasTools) setActiveTab('herramientas')
  }, [hasTools])

  const navValue = useMemo(
    () => ({
      goToSecciones,
      goToEquipo,
      goToHerramientas,
      activeTab,
    }),
    [goToSecciones, goToEquipo, goToHerramientas, activeTab],
  )

  const tabs = hasTools ? TAB_CONFIG : TAB_CONFIG.filter((t) => t.key !== 'herramientas')

  const resolvedTeamContent =
    typeof teamContent === 'function' ? teamContent(goToSecciones) : teamContent

  return (
    <PhaseWorkspaceNavContext.Provider value={navValue}>
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          const label = tab.key === 'herramientas' && toolsTabLabel ? toolsTabLabel : tab.label
          const icon = tab.key === 'herramientas' && toolsTabIcon ? toolsTabIcon : tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-violet-700 shadow-sm dark:bg-gray-800 dark:text-violet-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-base">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'secciones' && children}
      {activeTab === 'equipo' && resolvedTeamContent}
      {activeTab === 'herramientas' && hasTools && toolsContent}
    </div>
    </PhaseWorkspaceNavContext.Provider>
  )
}
