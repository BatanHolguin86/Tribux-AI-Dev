'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import type { Phase00Section, SectionStatus } from '@/types/conversation'
import { SECTION_LABELS } from '@/lib/ai/prompts/phase-00'
import { ChatMessage } from '@/components/shared/chat/ChatMessage'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'
import { ChatErrorBanner } from '@/components/shared/chat/ChatErrorBanner'
import { ApprovalGate } from '@/components/shared/ApprovalGate'

const SECTION_KICKOFF: Record<string, string> = {
  problem_statement: 'Hola, estoy listo para definir el Problem Statement de mi proyecto. Guiame con las preguntas clave.',
  personas: 'Necesito definir las User Personas de mi proyecto. Hazme las preguntas necesarias para construirlas.',
  value_proposition: 'Quiero trabajar en la Value Proposition. Guiame paso a paso.',
  metrics: 'Vamos a definir las Success Metrics del proyecto. Que necesitas saber?',
  competitive_analysis: 'Es momento del Competitive Analysis. Ayudame a estructurarlo.',
}

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

type ChatPanelProps = {
  projectId: string
  section: Phase00Section
  sectionStatus: SectionStatus
  initialMessages: Array<{ role: string; content: string; created_at?: string }>
  hasDocument: boolean
  onSectionApproved: () => void
  onDocumentGenerated: () => void
}

export function ChatPanel({
  projectId,
  section,
  sectionStatus,
  initialMessages,
  hasDocument,
  onSectionApproved,
  onDocumentGenerated,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const isApproved = sectionStatus === 'approved'

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new TextStreamChatTransport({
      api: `/api/projects/${projectId}/phases/0/chat`,
      body: { section },
    }),
    messages: initialMessages.map((m, i) => ({
      id: String(i),
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    })),
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const autoStartedRef = useRef(false)

  // Auto-start conversation when section has no messages
  useEffect(() => {
    if (
      !autoStartedRef.current &&
      initialMessages.length === 0 &&
      messages.length === 0 &&
      !isLoading &&
      !isApproved &&
      !hasDocument
    ) {
      autoStartedRef.current = true
      const kickoff = SECTION_KICKOFF[section] ?? `Vamos a trabajar en ${SECTION_LABELS[section]}.`
      sendMessage({ text: kickoff })
    }
  }, [section, initialMessages.length, messages.length, isLoading, isApproved, hasDocument, sendMessage])

  // Reset auto-start flag when section changes
  useEffect(() => {
    autoStartedRef.current = false
  }, [section])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Check if last assistant message indicates section is ready
  const lastMessage = messages[messages.length - 1]
  const lastText = lastMessage ? getTextContent(lastMessage) : ''
  const sectionReady =
    hasDocument ||
    (lastMessage?.role === 'assistant' && lastText.includes('[SECTION_READY]'))

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/phases/0/sections/${section}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const text = await res.text()
        setGenerateError(text || `Error ${res.status}`)
        return
      }

      // Consume the stream fully so the server's onFinish callback executes
      const reader = res.body?.getReader()
      if (reader) {
        while (true) {
          const { done } = await reader.read()
          if (done) break
        }
      }

      onDocumentGenerated()
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Error de conexion')
    } finally {
      setGenerating(false)
    }
  }

  async function handleApprove() {
    await fetch(`/api/projects/${projectId}/phases/0/sections/${section}/approve`, {
      method: 'POST',
    })
    onSectionApproved()
  }

  function handleRevision(feedback: string) {
    sendMessage({ text: feedback })
  }

  function onSubmit() {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex flex-1 flex-col">
      {error && <ChatErrorBanner error={error} />}
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            Preparando la sesion de {SECTION_LABELS[section]}...
          </div>
        )}

        {messages.map((msg) => {
          const text = getTextContent(msg)
          return (
            <ChatMessage
              key={msg.id}
              role={msg.role as 'user' | 'assistant'}
              content={text.replace('[SECTION_READY]', '')}
            />
          )
        })}

        {isLoading && <StreamingIndicator />}
      </div>

      {/* Generate button */}
      {sectionReady && !hasDocument && !isApproved && (
        <div className="mx-4 mb-3">
          {generateError && (
            <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{generateError}</p>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {generating ? 'Generando documento...' : `Generar documento de ${SECTION_LABELS[section]}`}
          </button>
        </div>
      )}

      {/* Approval gate */}
      {hasDocument && !isApproved && (
        <ApprovalGate
          sectionLabel={SECTION_LABELS[section]}
          onApprove={handleApprove}
          onRevisionRequest={handleRevision}
          isApproving={false}
        />
      )}

      {/* Approved banner */}
      {isApproved && (
        <div className="mx-4 mb-3 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700">
          Seccion aprobada
        </div>
      )}

      {/* Input */}
      {!isApproved && (
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          onStop={stop}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
