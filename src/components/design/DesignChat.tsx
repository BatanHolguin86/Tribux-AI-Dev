'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { ChatMessage } from '@/components/shared/chat/ChatMessage'
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
    <div className="flex h-full min-h-0 flex-col">
      {error && <ChatErrorBanner error={error} />}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
        {messages.length === 0 && isLoading && (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-6 py-10 text-center dark:border-violet-900/40 dark:bg-violet-950/20">
            <div
              className="h-11 w-11 animate-pulse rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 opacity-80"
              aria-hidden
            />
            <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Generando la primera respuesta…
            </p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              El UI/UX Designer está leyendo el contexto del proyecto (personas, propuesta de valor y pasos de esta
              herramienta). En unos segundos verás la síntesis CTO y el entregable.
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const text = getTextContent(msg)
          return (
            <div key={msg.id}>
              <ChatMessage role={msg.role as 'user' | 'assistant'} content={text} />
              {msg.role === 'assistant' && <CopyButton content={text} />}
            </div>
          )
        })}

        {isLoading && <StreamingIndicator />}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 p-3">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          onStop={stop}
          isLoading={isLoading}
          placeholder="Pide cambios al entregable o aclara dudas…"
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
        className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-400"
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
