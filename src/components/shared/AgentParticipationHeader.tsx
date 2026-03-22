'use client'

import { AGENT_MAP } from '@/lib/ai/agents'
import type { AgentType } from '@/types/agent'

type AgentParticipationHeaderProps = {
  agents: AgentType[]
}

export function AgentParticipationHeader({ agents }: AgentParticipationHeaderProps) {
  if (agents.length === 0) return null

  const resolvedAgents = agents
    .map((id) => AGENT_MAP[id])
    .filter(Boolean)

  return (
    <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/30">
      <div className="flex items-center -space-x-0.5">
        {resolvedAgents.map((agent) => (
          <span
            key={agent.id}
            title={`${agent.name} — ${agent.specialty}`}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
          >
            {agent.icon}
          </span>
        ))}
      </div>
      <span className="truncate text-xs text-gray-500 dark:text-gray-400">
        {resolvedAgents.map((a) => a.name).join(' · ')}
      </span>
    </div>
  )
}
