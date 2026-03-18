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
    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center -space-x-1">
        {resolvedAgents.map((agent) => (
          <span
            key={agent.id}
            title={`${agent.name} — ${agent.specialty}`}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-gray-800 text-[10px] ring-1 ring-gray-100 dark:ring-gray-700 cursor-default"
          >
            {agent.icon}
          </span>
        ))}
      </div>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
        {resolvedAgents.map((a) => a.name).join(' · ')}
      </span>
    </div>
  )
}
