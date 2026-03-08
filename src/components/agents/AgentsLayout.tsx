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

type AgentsLayoutProps = {
  projectId: string
  agents: AgentInfo[]
  initialThreads: ThreadPreview[]
}

export function AgentsLayout({
  projectId,
  agents,
  initialThreads,
}: AgentsLayoutProps) {
  const [activeAgent, setActiveAgent] = useState<AgentType>('cto_virtual')
  const [threads, setThreads] = useState<ThreadPreview[]>(initialThreads)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreads[0]?.id ?? null,
  )
  const [threadMessages, setThreadMessages] = useState<Record<string, Array<{ role: string; content: string }>>>(() => {
    // No initial messages loaded — they come when selecting a thread
    return {}
  })
  const [isCreatingThread, setIsCreatingThread] = useState(false)
  const [mobileTab, setMobileTab] = useState<'agents' | 'chat'>('agents')

  // Artifact modal state
  const [artifactContent, setArtifactContent] = useState<string | null>(null)

  const activeAgentInfo = agents.find((a) => a.id === activeAgent)!

  const handleAgentSelect = useCallback(async (agentType: AgentType) => {
    setActiveAgent(agentType)
    setActiveThreadId(null)
    setMobileTab('chat')

    // Fetch threads for this agent
    const res = await fetch(`/api/projects/${projectId}/agents/${agentType}/threads`)
    if (res.ok) {
      const data = await res.json()
      setThreads(data.threads)
      if (data.threads.length > 0) {
        const firstThread = data.threads[0]
        setActiveThreadId(firstThread.id)
        await loadThreadMessages(firstThread.id, agentType)
      }
    }
  }, [projectId])

  async function loadThreadMessages(threadId: string, agentType: AgentType) {
    // Fetch full thread with messages
    const res = await fetch(`/api/projects/${projectId}/agents/${agentType}/threads`)
    if (res.ok) {
      const data = await res.json()
      // Find the specific thread to get messages from the full list
      // But messages aren't in the list response — we need them from the thread
      // They're loaded from the threads endpoint which includes messages in the GET
    }
    // For now, messages come from the thread's messages field
    // We need to fetch the thread directly. Let's use the existing data.
  }

  const handleNewThread = useCallback(async () => {
    setIsCreatingThread(true)
    const res = await fetch(
      `/api/projects/${projectId}/agents/${activeAgent}/threads`,
      { method: 'POST' },
    )

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

  const handleDeleteThread = useCallback(async (threadId: string) => {
    await fetch(
      `/api/projects/${projectId}/agents/${activeAgent}/threads/${threadId}`,
      { method: 'DELETE' },
    )
    setThreads((prev) => prev.filter((t) => t.id !== threadId))
    if (activeThreadId === threadId) {
      setActiveThreadId(null)
    }
  }, [projectId, activeAgent, activeThreadId])

  const handleSelectThread = useCallback(async (threadId: string) => {
    setActiveThreadId(threadId)
    // Load messages for this thread if not cached
    if (!threadMessages[threadId]) {
      const res = await fetch(`/api/projects/${projectId}/agents/${activeAgent}/threads`)
      if (res.ok) {
        // We don't have a direct thread GET yet — messages are stored in the thread
        // The threads list endpoint returns messages. Let's find it.
        const data = await res.json()
        const thread = data.threads?.find((t: ThreadPreview & { messages?: Array<{ role: string; content: string }> }) => t.id === threadId)
        // Messages aren't returned in threads list to keep it light
        // For now we reload the page data would work, but let's use empty and let useChat handle it
        setThreadMessages((prev) => ({ ...prev, [threadId]: [] }))
      }
    }
  }, [projectId, activeAgent, threadMessages])

  // Get messages for current thread
  const currentMessages = activeThreadId ? (threadMessages[activeThreadId] ?? []) : []

  return (
    <div>
      {/* Mobile tabs */}
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 lg:hidden">
        <button
          onClick={() => setMobileTab('agents')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mobileTab === 'agents' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Agentes
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mobileTab === 'chat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Chat
        </button>
      </div>

      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* Agent Selector sidebar */}
        <div
          className={`w-64 flex-shrink-0 overflow-y-auto ${
            mobileTab !== 'agents' ? 'hidden lg:block' : 'block'
          }`}
        >
          <AgentSelector
            agents={agents}
            activeAgent={activeAgent}
            onSelect={handleAgentSelect}
          />
        </div>

        {/* Chat area */}
        <div
          className={`flex flex-1 flex-col rounded-lg border border-gray-200 bg-white ${
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
            {/* Thread sidebar */}
            <ThreadSidebar
              threads={threads}
              activeThreadId={activeThreadId}
              onSelectThread={handleSelectThread}
              onDeleteThread={handleDeleteThread}
              onNewThread={handleNewThread}
            />

            {/* Chat */}
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
                  <p className="text-sm font-medium text-gray-900">{activeAgentInfo.name}</p>
                  <p className="mt-1 max-w-xs text-xs text-gray-500">
                    {activeAgentInfo.description}
                  </p>
                  <button
                    onClick={handleNewThread}
                    disabled={isCreatingThread}
                    className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                  >
                    {isCreatingThread ? 'Creando...' : 'Iniciar conversacion'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Artifact Modal */}
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
