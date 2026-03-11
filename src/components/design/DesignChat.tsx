'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'
import { ChatErrorBanner } from '@/components/shared/chat/ChatErrorBanner'

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

type DesignChatProps = {
  projectId: string
  threadId: string
  initialPrompt: string
}

export function DesignChat({ projectId, threadId, initialPrompt }: DesignChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [hasSentInitial, setHasSentInitial] = useState(false)

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new TextStreamChatTransport({
      api: `/api/projects/${projectId}/agents/ui_ux_designer/threads/${threadId}/chat`,
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-send the template prompt on mount
  useEffect(() => {
    if (!hasSentInitial && initialPrompt) {
      setHasSentInitial(true)
      sendMessage({ text: initialPrompt })
    }
  }, [hasSentInitial, initialPrompt, sendMessage])

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

  return (
    <div className="flex h-full flex-col">
      {error && <ChatErrorBanner error={error} />}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((msg) => {
          const text = getTextContent(msg)
          const isAssistant = msg.role === 'assistant'
          return (
            <div key={msg.id} className={`flex gap-3 ${!isAssistant ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  !isAssistant ? 'bg-gray-200 text-gray-600' : 'bg-violet-100 text-violet-600'
                }`}
              >
                {!isAssistant ? 'Tu' : '🎨'}
              </div>
              <div className={`max-w-[85%] ${!isAssistant ? 'text-right' : ''}`}>
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
                  <CopyButton content={text} />
                )}
              </div>
            </div>
          )
        })}

        {isLoading && <StreamingIndicator />}
      </div>

      <div className="border-t border-gray-100 p-3">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          onStop={stop}
          isLoading={isLoading}
          placeholder="Pide ajustes al diseno..."
        />
      </div>
    </div>
  )
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-1">
      <button
        onClick={handleCopy}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title="Copiar al portapapeles"
      >
        {copied ? (
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}
