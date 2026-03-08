import { create } from 'zustand'
import type { AgentType } from '@/types/agent'

type ThreadPreview = {
  id: string
  title: string | null
  message_count: number
  last_message_at: string
  preview: string | null
}

type AgentsStore = {
  activeAgent: AgentType
  activeThreadId: string | null
  threads: ThreadPreview[]
  isStreaming: boolean
  setActiveAgent: (agent: AgentType) => void
  setActiveThread: (threadId: string | null) => void
  setThreads: (threads: ThreadPreview[]) => void
  addThread: (thread: ThreadPreview) => void
  removeThread: (threadId: string) => void
  setIsStreaming: (val: boolean) => void
}

export const useAgentsStore = create<AgentsStore>((set) => ({
  activeAgent: 'cto_virtual',
  activeThreadId: null,
  threads: [],
  isStreaming: false,
  setActiveAgent: (agent) =>
    set({ activeAgent: agent, activeThreadId: null, threads: [] }),
  setActiveThread: (threadId) => set({ activeThreadId: threadId }),
  setThreads: (threads) => set({ threads }),
  addThread: (thread) =>
    set((state) => ({
      threads: [thread, ...state.threads],
      activeThreadId: thread.id,
    })),
  removeThread: (threadId) =>
    set((state) => ({
      threads: state.threads.filter((t) => t.id !== threadId),
      activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId,
    })),
  setIsStreaming: (val) => set({ isStreaming: val }),
}))
