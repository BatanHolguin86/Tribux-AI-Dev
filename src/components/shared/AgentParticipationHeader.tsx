'use client'

import { AGENT_MAP } from '@/lib/ai/agents'
import type { AgentType } from '@/types/agent'

type AgentParticipationHeaderProps = {
  agents: AgentType[]
  label?: string
}

export function AgentParticipationHeader({ agents, label }: AgentParticipationHeaderProps) {
  if (agents.length === 0) return null

  const resolvedAgents = agents
    .map((id) => AGENT_MAP[id])
    .filter(Boolean)

  return (
    <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-4 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label ?? 'Agentes'}
      </span>
      <div className="flex items-center -space-x-1">
        {resolvedAgents.map((agent) => (
          <span
            key={agent.id}
            title={`${agent.name} — ${agent.specialty}`}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-700 text-xs ring-2 ring-gray-50 dark:ring-gray-800 cursor-default"
          >
            {agent.icon}
          </span>
        ))}
      </div>
      <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
        {resolvedAgents.map((a) => a.name).join(' · ')}
      </span>
    </div>
  )
}
