'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'
import { ChatErrorBanner } from '@/components/shared/chat/ChatErrorBanner'
import { MessageActions } from './MessageActions'
import { ProactiveSuggestions } from './ProactiveSuggestions'

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

type AgentChatProps = {
  projectId: string
  agentType: string
  threadId: string
  initialMessages: Array<{ role: string; content: string }>
  onSaveArtifact: (content: string) => void
}

export function AgentChat({
  projectId,
  agentType,
  threadId,
  initialMessages,
  onSaveArtifact,
}: AgentChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new TextStreamChatTransport({
      api: `/api/projects/${projectId}/agents/${agentType}/threads/${threadId}/chat`,
    }),
    messages: initialMessages.map((m, i) => ({
      id: String(i),
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    })),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  function onSubmit() {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  function handleSuggestionClick(text: string) {
    sendMessage({ text })
  }

  return (
    <div className="flex flex-1 flex-col">
      {error && <ChatErrorBanner error={error} />}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !isLoading && (
          <>
            <ProactiveSuggestions
              projectId={projectId}
              agentType={agentType}
              onSuggestionClick={handleSuggestionClick}
            />
            <div className="flex items-center justify-center py-8 text-sm text-gray-400">
              Escribe tu pregunta para comenzar la conversacion.
            </div>
          </>
        )}

        {messages.map((msg) => {
          const text = getTextContent(msg)
          const isAssistant = msg.role === 'assistant'
          return (
            <div key={msg.id} className={`group flex gap-3 ${!isAssistant ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  !isAssistant ? 'bg-gray-200 text-gray-600' : 'bg-violet-100 text-violet-600'
                }`}
              >
                {!isAssistant ? 'Tu' : 'AI'}
              </div>
              <div className={`max-w-[80%] ${!isAssistant ? 'text-right' : ''}`}>
                <div
                  className={`inline-block rounded-2xl px-4 py-2.5 text-sm ${
                    !isAssistant
                      ? 'rounded-br-md bg-violet-600 text-white'
                      : 'rounded-bl-md bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{text}</div>
                </div>
                {isAssistant && (
                  <MessageActions
                    content={text}
                    onSaveArtifact={onSaveArtifact}
                  />
                )}
              </div>
            </div>
          )
        })}

        {isLoading && <StreamingIndicator />}
      </div>

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={onSubmit}
        onStop={stop}
        isLoading={isLoading}
      />
    </div>
  )
}
