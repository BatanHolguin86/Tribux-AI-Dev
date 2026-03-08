'use client'

import type { AgentType } from '@/types/agent'
import type { Plan } from '@/types/user'
import { AgentCard } from './AgentCard'

type AgentInfo = {
  id: AgentType
  name: string
  icon: string
  specialty: string
  planRequired: Plan
  accessible: boolean
  threadCount: number
}

type AgentSelectorProps = {
  agents: AgentInfo[]
  activeAgent: AgentType
  onSelect: (agentType: AgentType) => void
}

export function AgentSelector({ agents, activeAgent, onSelect }: AgentSelectorProps) {
  const cto = agents.find((a) => a.id === 'cto_virtual')!
  const specialized = agents.filter((a) => a.id !== 'cto_virtual')

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase text-gray-500">Agentes</h3>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        <AgentCard
          icon={cto.icon}
          name={cto.name}
          specialty={cto.specialty}
          threadCount={cto.threadCount}
          isActive={activeAgent === cto.id}
          isLocked={false}
          onClick={() => onSelect(cto.id)}
        />

        <div className="px-3 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Especializados
          </p>
        </div>

        {specialized.map((agent) => (
          <AgentCard
            key={agent.id}
            icon={agent.icon}
            name={agent.name}
            specialty={agent.specialty}
            threadCount={agent.threadCount}
            isActive={activeAgent === agent.id}
            isLocked={!agent.accessible}
            onClick={() => agent.accessible && onSelect(agent.id)}
          />
        ))}
      </div>
    </div>
  )
}
