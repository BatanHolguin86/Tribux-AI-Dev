'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ChatMessage } from '@/components/shared/chat/ChatMessage'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'
import { ChatErrorBanner } from '@/components/shared/chat/ChatErrorBanner'
import { EmptyResponseBanner } from '@/components/shared/chat/EmptyResponseBanner'
import { QuickReplies, extractOptions } from '@/components/shared/chat/QuickReplies'
import { PHASE_KICKOFF_MESSAGES, PHASE03_KICKOFF_BY_PERSONA } from '@/lib/ai/prompts/phase-chat-builders'
import { PHASE_NAMES } from '@/types/project'
import { useFounderMode } from '@/hooks/useFounderMode'

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

type PhaseChatPanelProps = {
  projectId: string
  phaseNumber: number
  initialMessages: Array<{ role: string; content: string; created_at?: string }>
}

export function PhaseChatPanel({ projectId, phaseNumber, initialMessages }: PhaseChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const kickoffSent = useRef(false)
  const [input, setInput] = useState('')
  const { persona } = useFounderMode()

  // Use persona-specific kickoff for Phase 03, default for others
  const kickoffMessage = (phaseNumber === 3 && persona)
    ? (PHASE03_KICKOFF_BY_PERSONA[persona] ?? PHASE_KICKOFF_MESSAGES[3] ?? '')
    : (PHASE_KICKOFF_MESSAGES[phaseNumber] ?? '')
  const phaseName = PHASE_NAMES[phaseNumber] ?? `Phase ${phaseNumber}`

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new TextStreamChatTransport({
      api: `/api/projects/${projectId}/phases/${phaseNumber}/chat`,
    }),
    messages: initialMessages.map((m, i) => ({
      id: String(i),
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    })),
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const [emptyResponseError, setEmptyResponseError] = useState(false)
  const prevStatusRef = useRef(status)

  useEffect(() => {
    const wasLoading = prevStatusRef.current === 'streaming' || prevStatusRef.current === 'submitted'
    if (wasLoading && status === 'ready' && messages.length > 0) {
      const last = messages[messages.length - 1]
      const text = last ? getTextContent(last) : ''
      setEmptyResponseError(last?.role === 'user' || text.trim() === '')
    }
    prevStatusRef.current = status
  }, [status, messages])

  // Auto-kickoff on first visit
  useEffect(() => {
    if (initialMessages.length === 0 && !kickoffSent.current && kickoffMessage) {
      kickoffSent.current = true
      sendMessage({ text: kickoffMessage })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Quick replies from last assistant message
  const lastMessage = messages[messages.length - 1]
  const lastText = lastMessage ? getTextContent(lastMessage) : ''
  const lastAssistantText = lastMessage?.role === 'assistant' ? lastText : ''
  const { options: quickOptions } = extractOptions(lastAssistantText)
  const showQuickReplies = quickOptions.length > 0 && !isLoading

  function handleQuickReply(option: string) {
    sendMessage({ text: option })
  }

  function onSubmit() {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {error && <ChatErrorBanner error={error} />}
      {emptyResponseError && !error && <EmptyResponseBanner />}
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
          <div className="mx-3 my-2 rounded-lg border-l-4 border-brand-amber/30 bg-brand-amber/5 p-3 text-sm text-brand-amber dark:text-brand-amber" role="alert">
            <p className="text-xs font-medium">{parsed.error === 'credits_insufficient' ? 'Creditos insuficientes' : 'Error de conexion'}</p>
            <p className="mt-0.5 text-xs opacity-80">{parsed.message}</p>
          </div>
        )
      })()}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-teal/30 border-t-[#0F2B46]" />
            <p className="text-sm text-brand-primary font-medium">
              El CTO esta analizando {phaseName}...
            </p>
            <p className="text-xs text-gray-400">
              Preparando guia basada en el contexto del proyecto
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const text = getTextContent(msg)
          // Hide auto-kickoff user messages
          if (msg.role === 'user' && text === kickoffMessage) {
            return null
          }
          const { cleanText } = extractOptions(text)
          return (
            <ChatMessage
              key={msg.id}
              role={msg.role as 'user' | 'assistant'}
              content={cleanText}
              projectId={projectId}
              agentName={msg.role === 'assistant' ? 'CTO Virtual' : undefined}
              agentIcon={msg.role === 'assistant' ? '🧠' : undefined}
            />
          )
        })}

        {isLoading && <StreamingIndicator />}
      </div>

      {/* Quick replies */}
      {showQuickReplies && (
        <QuickReplies options={quickOptions} onSelect={handleQuickReply} />
      )}

      {/* Input */}
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
