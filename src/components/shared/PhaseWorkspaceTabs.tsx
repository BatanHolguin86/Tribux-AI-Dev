'use client'

import { useState } from 'react'
import type { AgentType } from '@/types/agent'

export type PhaseTab = 'secciones' | 'equipo' | 'herramientas'

type PhaseWorkspaceTabsProps = {
  phaseNumber: number
  projectId: string
  hasTools?: boolean
  /** Agent types assigned to this phase (from phase-agents config) */
  phaseAgents: AgentType[]
  /** Content for the main Secciones tab */
  children: React.ReactNode
  /** Content for the Equipo tab — rendered by parent */
  teamContent: React.ReactNode
  /** Content for the Herramientas tab — rendered by parent */
  toolsContent?: React.ReactNode
  /** Optional: initial tab override */
  initialTab?: PhaseTab
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
}: PhaseWorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState<PhaseTab>(initialTab)

  const tabs = hasTools ? TAB_CONFIG : TAB_CONFIG.filter((t) => t.key !== 'herramientas')

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
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
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'secciones' && children}
      {activeTab === 'equipo' && teamContent}
      {activeTab === 'herramientas' && hasTools && toolsContent}
    </div>
  )
}
