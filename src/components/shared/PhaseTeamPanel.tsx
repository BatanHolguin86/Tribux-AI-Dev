'use client'

import { useState, useCallback } from 'react'
import type { AgentType } from '@/types/agent'
import { AGENT_MAP } from '@/lib/ai/agents'
import { AgentChat } from '@/components/agents/AgentChat'

type PhaseTeamPanelProps = {
  projectId: string
  phaseNumber: number
  /** Agent types for this phase (from phase-agents config) */
  agentTypes: AgentType[]
}

export function PhaseTeamPanel({ projectId, phaseNumber, agentTypes }: PhaseTeamPanelProps) {
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleOpenAgent = useCallback(
    async (agentType: AgentType) => {
      setIsCreating(true)
      setActiveAgent(agentType)
      try {
        const res = await fetch(`/api/projects/${projectId}/agents/${agentType}/threads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Phase ${String(phaseNumber).padStart(2, '0')} — ${agentType}` }),
        })
        if (res.ok) {
          const data = await res.json()
          setThreadId(data.id)
        }
      } finally {
        setIsCreating(false)
      }
    },
    [projectId, phaseNumber],
  )

  const handleBack = useCallback(() => {
    setActiveAgent(null)
    setThreadId(null)
  }, [])

  // Deduplicate agents (CTO always first)
  const uniqueAgents = [...new Set(['cto_virtual' as AgentType, ...agentTypes])]

  // Active agent chat view
  if (activeAgent && threadId) {
    const agent = AGENT_MAP[activeAgent]
    return (
      <div className="flex flex-col">
        {/* Header with back */}
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Equipo
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{agent.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{agent.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{agent.specialty}</p>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="flex h-[min(65vh,550px)] flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <AgentChat
            key={`${activeAgent}-${threadId}`}
            projectId={projectId}
            agentType={activeAgent}
            threadId={threadId}
            initialMessages={[]}
            onSaveArtifact={() => {}}
          />
        </div>
      </div>
    )
  }

  // Loading state while creating thread
  if (activeAgent && isCreating) {
    const agent = AGENT_MAP[activeAgent]
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <span className="text-3xl">{agent.icon}</span>
          <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Conectando con {agent.name}...
          </p>
          <div className="mt-3 h-1.5 w-24 mx-auto overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-1.5 w-12 animate-pulse rounded-full bg-violet-500" />
          </div>
        </div>
      </div>
    )
  }

  // Agent cards grid
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Equipo de Phase {String(phaseNumber).padStart(2, '0')}
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Agentes asignados a esta fase. Consulta a cualquiera sobre el trabajo en curso.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {uniqueAgents.map((agentType) => {
          const agent = AGENT_MAP[agentType]
          if (!agent) return null
          const isLeader = agentType === 'cto_virtual'

          return (
            <button
              key={agentType}
              onClick={() => handleOpenAgent(agentType)}
              className={`group flex flex-col rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                isLeader
                  ? 'border-violet-200 bg-violet-50/30 hover:border-violet-300 dark:border-violet-800/50 dark:bg-violet-950/10 dark:hover:border-violet-700'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-gray-800">
                  {agent.icon}
                </span>
                {isLeader && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                    Lider
                  </span>
                )}
              </div>
              <h4 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {agent.name}
              </h4>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {agent.specialty}
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-violet-400">
                Consultar
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
