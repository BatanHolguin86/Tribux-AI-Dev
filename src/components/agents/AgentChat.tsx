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
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [attachments, setAttachments] = useState<Array<Record<string, unknown>>>([])

  async function loadAttachments() {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/agents/${agentType}/threads/${threadId}`,
      )
      if (!res.ok) return
      const data = await res.json()
      const items = Array.isArray(data.attachments) ? data.attachments : []
      setAttachments(items)
    } catch {
      // Silenciar errores de UI; el chat sigue funcionando aunque falle esta carga
    }
  }

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new TextStreamChatTransport({
      api: `/api/projects/${projectId}/agents/${agentType}/threads/${threadId}/chat`,
    }),
    fetch: async (input, init) => {
      // Adaptar el payload para enviar FormData con mensajes + adjuntos
      const url = typeof input === 'string' ? input : input.toString()
      const headers = new Headers(init?.headers)
      const isJson = headers.get('Content-Type')?.includes('application/json')

      if (isJson) {
        const body = init?.body ? JSON.parse(init.body as string) : {}
        const formData = new FormData()
        formData.append('messages', JSON.stringify(body.messages ?? []))
        pendingFiles.forEach((file) => {
          formData.append('attachments', file)
        })

        headers.delete('Content-Type')

        return fetch(url, {
          ...init,
          headers,
          body: formData,
        })
      }

      return fetch(input, init)
    },
    messages: initialMessages.map((m, i) => ({
      id: String(i),
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    })),
    onFinish() {
      // Limpiar adjuntos y refrescar lista desde el servidor
      setPendingFiles([])
      void loadAttachments()
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  useEffect(() => {
    void loadAttachments()
  }, [projectId, agentType, threadId])

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
      {attachments.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
          <div className="mb-1 font-medium text-gray-600">
            Adjuntos recientes del hilo
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.slice(-3).map((att, index) => {
              const key = (att.id as string | undefined) ?? `att-${index}`
              const name = (att.filename as string | undefined) ?? 'archivo'
              const size = att.size as number | undefined
              return (
                <div
                  key={key}
                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1"
                >
                  <span className="text-[10px] uppercase text-gray-400">FILE</span>
                  <span className="max-w-[140px] truncate text-xs text-gray-700">
                    {name}
                  </span>
                  {typeof size === 'number' && (
                    <span className="text-[10px] text-gray-400">
                      {(size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
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
        onFilesChange={(files) => setPendingFiles(files ? Array.from(files) : [])}
        hasAttachments={pendingFiles.length > 0}
      />
    </div>
  )
}
