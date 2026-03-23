'use client'

import type { AgentType } from '@/types/agent'
import { AGENT_MAP } from '@/lib/ai/agents'
import { getPhaseSectionAgents } from '@/lib/phase-workspace-config'

type PhaseTeamPanelProps = {
  projectId: string
  phaseNumber: number
  agentTypes: AgentType[]
  /** Navigate to Secciones tab where the real work happens */
  onGoToSecciones?: () => void
}

export function PhaseTeamPanel({ phaseNumber, agentTypes, onGoToSecciones }: PhaseTeamPanelProps) {
  const sectionMappings = getPhaseSectionAgents(phaseNumber)

  // Deduplicate agents (CTO always first)
  const uniqueAgents = [...new Set(['cto_virtual' as AgentType, ...agentTypes])]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Equipo de Phase {String(phaseNumber).padStart(2, '0')}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          Estos agentes ya trabajan dentro de cada seccion de la fase.
          Al avanzar en <span className="font-medium text-gray-700 dark:text-gray-300">Secciones</span>,
          el CTO coordina a los especialistas para generar entregables que tu validas.
        </p>
      </div>

      {/* Agent roster */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Agentes asignados
        </h4>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {uniqueAgents.map((agentType) => {
            const agent = AGENT_MAP[agentType]
            if (!agent) return null
            const isLeader = agentType === 'cto_virtual'

            // Find which sections this agent participates in
            const agentSections = sectionMappings
              .filter((m) => m.agents.includes(agentType))
              .map((m) => m.label)

            return (
              <div
                key={agentType}
                className={`rounded-xl border p-3 ${
                  isLeader
                    ? 'border-violet-200 bg-violet-50/30 dark:border-violet-800/50 dark:bg-violet-950/10'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-base dark:bg-gray-800">
                    {agent.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {agent.name}
                      </p>
                      {isLeader && (
                        <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                          Lider
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {agent.specialty}
                    </p>
                  </div>
                </div>

                {/* Sections this agent works on */}
                {agentSections.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {agentSections.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Section → agent mapping table */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Secciones y responsables
        </h4>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          {sectionMappings.map((mapping, i) => (
            <div
              key={mapping.section}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                i > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {mapping.label}
                </p>
              </div>
              <div className="flex items-center -space-x-1.5">
                {mapping.agents.map((agentType) => {
                  const agent = AGENT_MAP[agentType]
                  if (!agent) return null
                  return (
                    <span
                      key={agentType}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs dark:border-gray-900 dark:bg-gray-800"
                      title={agent.name}
                    >
                      {agent.icon}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA to go work */}
      {onGoToSecciones && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-800/40 dark:bg-violet-950/20">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            El trabajo real ocurre en <span className="font-semibold">Secciones</span>. Cada seccion tiene un chat
            donde el CTO coordina a los especialistas. Tu rol: validar cada entregable para avanzar a la siguiente seccion.
          </p>
          <button
            onClick={onGoToSecciones}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            Ir a Secciones
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
