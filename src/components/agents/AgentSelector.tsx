'use client'

import type { AgentType } from '@/types/agent'
import type { Plan } from '@/types/user'
import { AgentCard } from './AgentCard'

const AGENT_COLORS: Record<string, string> = {
  cto_virtual: '#0EA5A3',
  product_architect: '#6366F1',
  system_architect: '#8B5CF6',
  ui_ux_designer: '#EC4899',
  lead_developer: '#0EA5A3',
  db_admin: '#F59E0B',
  qa_engineer: '#10B981',
  devops_engineer: '#F97316',
  operator: '#F97316',
}

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
    <div className="flex flex-col rounded-lg border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="border-b border-gray-100 dark:border-gray-800 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase text-[#64748B] dark:text-[#94A3B8]">Agentes</h3>
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
          agentColor={AGENT_COLORS[cto.id]}
        />

        <div className="px-3 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
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
            agentColor={AGENT_COLORS[agent.id]}
          />
        ))}
      </div>
    </div>
  )
}
