'use client'

import { useState, useCallback } from 'react'
import type { AgentType } from '@/types/agent'
import type { Plan } from '@/types/user'
import { AgentSelector } from './AgentSelector'
import { AgentHeader } from './AgentHeader'
import { ThreadSidebar } from './ThreadSidebar'
import { AgentChat } from './AgentChat'
import { SaveArtifactModal } from './SaveArtifactModal'

type AgentInfo = {
  id: AgentType
  name: string
  icon: string
  specialty: string
  description: string
  planRequired: Plan
  accessible: boolean
  threadCount: number
}

type ThreadPreview = {
  id: string
  title: string | null
  message_count: number
  last_message_at: string
  preview: string | null
}

type AgentsAdvancedLayoutProps = {
  projectId: string
  agents: AgentInfo[]
  initialThreads: ThreadPreview[]
}

/**
 * Advanced mode: user can directly talk to specialized agents.
 * This is intentionally separate from the CTO-only hub used for the main workflow by phases.
 */
export function AgentsAdvancedLayout({
  projectId,
  agents,
  initialThreads,
}: AgentsAdvancedLayoutProps) {
  const [activeAgent, setActiveAgent] = useState<AgentType>('cto_virtual')
  const [threads, setThreads] = useState<ThreadPreview[]>(initialThreads)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreads[0]?.id ?? null,
  )
  const [threadMessages, setThreadMessages] = useState<
    Record<string, Array<{ role: string; content: string }>>
  >(() => ({}))
  const [isCreatingThread, setIsCreatingThread] = useState(false)
  const [mobileTab, setMobileTab] = useState<'agents' | 'chat'>('agents')

  const [artifactContent, setArtifactContent] = useState<string | null>(null)

  const activeAgentInfo = agents.find((a) => a.id === activeAgent) ?? agents[0]

  const handleAgentSelect = useCallback(
    async (agentType: AgentType) => {
      setActiveAgent(agentType)
      setActiveThreadId(null)
      setMobileTab('chat')

      const res = await fetch(`/api/projects/${projectId}/agents/${agentType}/threads`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data.threads) ? (data.threads as ThreadPreview[]) : []
        setThreads(list)
        if (list.length > 0) {
          setActiveThreadId(list[0].id)
          setThreadMessages((prev) => ({ ...prev, [list[0].id]: [] }))
        }
      }
    },
    [projectId],
  )

  const handleNewThread = useCallback(async () => {
    setIsCreatingThread(true)
    const res = await fetch(`/api/projects/${projectId}/agents/${activeAgent}/threads`, {
      method: 'POST',
    })

    if (res.ok) {
      const data = await res.json()
      const newThread: ThreadPreview = {
        id: data.id,
        title: null,
        message_count: 0,
        last_message_at: new Date().toISOString(),
        preview: null,
      }
      setThreads((prev) => [newThread, ...prev])
      setActiveThreadId(data.id)
      setThreadMessages((prev) => ({ ...prev, [data.id]: [] }))
    }
    setIsCreatingThread(false)
  }, [projectId, activeAgent])

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      await fetch(`/api/projects/${projectId}/agents/${activeAgent}/threads/${threadId}`, {
        method: 'DELETE',
      })
      setThreads((prev) => prev.filter((t) => t.id !== threadId))
      if (activeThreadId === threadId) {
        setActiveThreadId(null)
      }
    },
    [projectId, activeAgent, activeThreadId],
  )

  const handleSelectThread = useCallback(
    async (threadId: string) => {
      setActiveThreadId(threadId)
      if (!threadMessages[threadId]) {
        setThreadMessages((prev) => ({ ...prev, [threadId]: [] }))
      }
    },
    [threadMessages],
  )

  const currentMessages = activeThreadId ? (threadMessages[activeThreadId] ?? []) : []

  return (
    <div>
      {/* Mobile tabs */}
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 lg:hidden">
        <button
          onClick={() => setMobileTab('agents')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mobileTab === 'agents'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-gray-900/20'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Agentes
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mobileTab === 'chat'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-gray-900/20'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Chat
        </button>
      </div>

      <div className="flex h-[var(--content-height)] gap-4">
        {/* Agent Selector sidebar */}
        <div
          className={`w-64 flex-shrink-0 overflow-y-auto ${
            mobileTab !== 'agents' ? 'hidden lg:block' : 'block'
          }`}
        >
          <AgentSelector agents={agents} activeAgent={activeAgent} onSelect={handleAgentSelect} />
        </div>

        {/* Chat area */}
        <div
          className={`flex flex-1 flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${
            mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <AgentHeader
            icon={activeAgentInfo.icon}
            name={activeAgentInfo.name}
            specialty={activeAgentInfo.specialty}
            onNewThread={handleNewThread}
            isCreating={isCreatingThread}
          />

          <div className="flex flex-1 overflow-hidden">
            <ThreadSidebar
              threads={threads}
              activeThreadId={activeThreadId}
              onSelectThread={handleSelectThread}
              onDeleteThread={handleDeleteThread}
              onNewThread={handleNewThread}
            />

            {activeThreadId ? (
              <AgentChat
                key={`${activeAgent}-${activeThreadId}`}
                projectId={projectId}
                agentType={activeAgent}
                threadId={activeThreadId}
                initialMessages={currentMessages}
                onSaveArtifact={(content) => setArtifactContent(content)}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 text-4xl">{activeAgentInfo.icon}</div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activeAgentInfo.name}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">
                    {activeAgentInfo.description}
                  </p>
                  <button
                    onClick={handleNewThread}
                    disabled={isCreatingThread || !activeAgentInfo.accessible}
                    className="mt-4 rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-medium text-white shadow-sm dark:shadow-gray-900/20 hover:bg-[#0A1F33] disabled:opacity-50"
                  >
                    {activeAgentInfo.accessible ? (isCreatingThread ? 'Creando...' : 'Iniciar conversacion') : 'Bloqueado por plan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {artifactContent && (
        <SaveArtifactModal
          projectId={projectId}
          content={artifactContent}
          onClose={() => setArtifactContent(null)}
          onSaved={() => setArtifactContent(null)}
        />
      )}
    </div>
  )
}

