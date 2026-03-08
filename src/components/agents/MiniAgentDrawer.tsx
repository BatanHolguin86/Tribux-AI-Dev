'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

type MiniAgentDrawerProps = {
  projectId: string
  onClose: () => void
}

export function MiniAgentDrawer({ projectId, onClose }: MiniAgentDrawerProps) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [threadId, setThreadId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // Create a thread on mount
  useEffect(() => {
    async function init() {
      const res = await fetch(
        `/api/projects/${projectId}/agents/cto_virtual/threads`,
        { method: 'POST' },
      )
      if (res.ok) {
        const data = await res.json()
        setThreadId(data.id)
        setReady(true)
      }
    }
    init()
  }, [projectId])

  const { messages, sendMessage, status, stop } = useChat({
    transport: new TextStreamChatTransport({
      api: `/api/projects/${projectId}/agents/cto_virtual/threads/${threadId ?? 'pending'}/chat`,
    }),
    messages: [],
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  function onSubmit() {
    if (!input.trim() || !ready) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[500px] w-[400px] flex-col rounded-tl-xl border border-gray-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="text-sm font-semibold text-gray-900">CTO Virtual</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(`/projects/${projectId}/agents`)}
            className="rounded p-1.5 text-xs text-violet-600 hover:bg-violet-50"
          >
            Abrir completo
          </button>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center py-8 text-xs text-gray-400">
            Pregunta lo que necesites sobre tu proyecto.
          </div>
        )}

        {messages.map((msg) => {
          const text = getTextContent(msg)
          const isUser = msg.role === 'user'
          return (
            <div key={msg.id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                  isUser
                    ? 'rounded-br-sm bg-violet-600 text-white'
                    : 'rounded-bl-sm bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{text}</div>
              </div>
            </div>
          )
        })}

        {isLoading && <StreamingIndicator />}
      </div>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={onSubmit}
        onStop={stop}
        isLoading={isLoading}
        disabled={!ready}
      />
    </div>
  )
}
