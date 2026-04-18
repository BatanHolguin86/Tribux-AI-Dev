'use client'

import { useState } from 'react'
import { ThreadItem } from './ThreadItem'

type Thread = {
  id: string
  title: string | null
  message_count: number
  last_message_at: string
  preview: string | null
}

type ThreadSidebarProps = {
  threads: Thread[]
  activeThreadId: string | null
  onSelectThread: (threadId: string) => void
  onDeleteThread: (threadId: string) => void
  onNewThread: () => void
}

export function ThreadSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onDeleteThread,
  onNewThread,
}: ThreadSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div className="flex flex-col items-center border-r border-gray-100 dark:border-gray-800 py-2">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-400"
          title="Mostrar hilos"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-52 flex-col border-r border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between border-b border-gray-50 px-3 py-2">
        <span className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Hilos</span>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-400"
          aria-label="Colapsar panel de hilos"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto p-1.5">
        <button
          onClick={onNewThread}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-primary dark:text-brand-teal transition-colors hover:bg-brand-surface dark:hover:bg-brand-primary/20"
        >
          <span>+</span> Nueva conversacion
        </button>

        {threads.map((t) => (
          <ThreadItem
            key={t.id}
            id={t.id}
            title={t.title}
            messageCount={t.message_count}
            lastMessageAt={t.last_message_at}
            isActive={t.id === activeThreadId}
            onClick={() => onSelectThread(t.id)}
            onDelete={onDeleteThread}
          />
        ))}

        {threads.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
            Sin conversaciones aun
          </p>
        )}
      </div>
    </div>
  )
}
