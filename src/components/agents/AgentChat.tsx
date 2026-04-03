'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isToolUIPart } from 'ai'
import type { UIMessage, UIMessagePart, UIDataTypes, UITools } from 'ai'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { ChatMessage } from '@/components/shared/chat/ChatMessage'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'
import { ChatErrorBanner } from '@/components/shared/chat/ChatErrorBanner'
import { ToolCallRenderer } from '@/components/shared/chat/ToolCallRenderer'
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
  repoUrl?: string | null
  supabaseProjectRef?: string | null
  onSaveArtifact: (content: string) => void
}

export function AgentChat({
  projectId,
  agentType,
  threadId,
  initialMessages,
  repoUrl,
  supabaseProjectRef,
  onSaveArtifact,
}: AgentChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [attachments, setAttachments] = useState<Array<Record<string, unknown>>>([])

  const loadAttachments = useCallback(async () => {
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
  }, [projectId, agentType, threadId])

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/projects/${projectId}/agents/${agentType}/threads/${threadId}/chat`,
      fetch: async (input, init) => {
        // Adaptar el payload para enviar FormData con mensajes + adjuntos
        const url = typeof input === 'string' ? input : input.toString()
        const headers = new Headers(init?.headers)
        const isJson = headers.get('Content-Type')?.includes('application/json')

        if (isJson && pendingFiles.length > 0) {
          const body = init?.body ? JSON.parse(init.body as string) : {}
          const formData = new FormData()
          formData.append('messages', JSON.stringify(body.messages ?? []))
          pendingFiles.forEach((file) => {
            formData.append('attachments', file)
          })
          headers.delete('Content-Type')
          return fetch(url, { ...init, headers, body: formData })
        }

        return fetch(input, init)
      },
    }),
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
    queueMicrotask(() => {
      void loadAttachments()
    })
  }, [loadAttachments])

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
      {(() => {
        const lastMsg = messages[messages.length - 1]
        const text = lastMsg?.role === 'assistant'
          ? (lastMsg.parts?.filter((p: { type: string }) => p.type === 'text').map((p: { text?: string }) => p.text ?? '').join('') ?? '')
          : ''
        const match = text.match(/__STREAM_ERROR__:([\s\S]+)/)
        if (!match) return null
        let parsed: { error: string; message: string } | null = null
        try { parsed = JSON.parse(match[1]) } catch { return null }
        if (!parsed) return null
        return (
          <div className="mx-3 my-2 rounded-lg border-l-4 border-[#F59E0B]/30 bg-[#F59E0B]/5 p-3 text-sm text-[#F59E0B] dark:text-[#F59E0B]" role="alert">
            <p className="text-xs font-medium">{parsed.error === 'credits_insufficient' ? 'Creditos insuficientes' : 'Error de conexion'}</p>
            <p className="mt-0.5 text-xs opacity-80">{parsed.message}</p>
          </div>
        )
      })()}
      {attachments.length > 0 && (
        <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="mb-1 font-medium text-gray-700 dark:text-gray-300">
            Archivos adjuntos en esta conversacion
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.slice(-3).map((att, index) => {
              const key = (att.id as string | undefined) ?? `att-${index}`
              const name = (att.filename as string | undefined) ?? 'archivo'
              const size = att.size as number | undefined
              return (
                <div
                  key={key}
                  className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1"
                >
                  <span className="text-[10px] uppercase text-gray-400 dark:text-gray-500">ARCHIVO</span>
                  <span className="max-w-[140px] truncate text-xs text-gray-700 dark:text-gray-300">
                    {name}
                  </span>
                  {typeof size === 'number' && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {(size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
        {messages.length === 0 && !isLoading && (
          <>
            <ProactiveSuggestions
              projectId={projectId}
              agentType={agentType}
              onSuggestionClick={handleSuggestionClick}
            />
            <div className="flex items-center justify-center py-8 text-sm text-gray-400 dark:text-gray-500">
              Escribe tu pregunta para comenzar la conversacion.
            </div>
          </>
        )}

        {messages.map((msg) => {
          const text = getTextContent(msg)
          const allParts = msg.parts as UIMessagePart<UIDataTypes, UITools>[]
          const toolParts = allParts.filter(isToolUIPart)
          return (
            <div key={msg.id} className="group">
              {/* Tool calls (visible only on assistant messages) */}
              {msg.role === 'assistant' && toolParts.length > 0 && (
                <div className="mb-1 pl-1">
                  {toolParts.map((p) => (
                    <ToolCallRenderer
                      key={p.toolCallId}
                      part={p}
                    />
                  ))}
                </div>
              )}
              {/* Text content (only render if there's text) */}
              {text && (
                <ChatMessage
                  role={msg.role as 'user' | 'assistant'}
                  content={text}
                  projectId={projectId}
                />
              )}
              {msg.role === 'assistant' && text && (
                <MessageActions
                  content={text}
                  projectId={projectId}
                  repoUrl={repoUrl}
                  supabaseProjectRef={supabaseProjectRef}
                  onSaveArtifact={onSaveArtifact}
                />
              )}
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
