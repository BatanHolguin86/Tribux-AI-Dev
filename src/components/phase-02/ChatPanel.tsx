'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import type { Phase02Section, SectionStatus } from '@/types/conversation'
import { SECTION_LABELS } from '@/lib/ai/prompts/phase-02'
import { ChatMessage } from '@/components/shared/chat/ChatMessage'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'
import { ChatErrorBanner } from '@/components/shared/chat/ChatErrorBanner'
import { ApprovalGate } from '@/components/shared/ApprovalGate'
import { AgentParticipationHeader } from '@/components/shared/AgentParticipationHeader'
import { QuickReplies, extractOptions } from '@/components/shared/chat/QuickReplies'
import { PHASE_02_AGENTS } from '@/lib/ai/agents/phase-agents'

const KICKOFF_PREFIXES_P02 = ['Dame tu vision', 'Propone un resumen', 'Dame una vista', 'Identifica las', 'Como CTO, analiza', 'Como CTO, basandote', 'Como CTO, documenta']

function isKickoffMessage(content: string): boolean {
  return KICKOFF_PREFIXES_P02.some((prefix) => content.startsWith(prefix))
}

const SECTION_KICKOFF: Record<string, string> = {
  system_architecture:
    'Dame tu vision de alto nivel de la System Architecture: componentes principales, como se conectan y por que. Resumen ejecutivo en 3-4 parrafos, luego profundizamos.',
  database_design:
    'Propone un resumen del Database Design: entidades principales, relaciones clave y estrategia de RLS. Vista general breve, luego detallamos tabla por tabla.',
  api_design:
    'Dame una vista general del API Design: cuantos endpoints, como los agrupas y cual es el patron de auth. Resumen breve, luego definimos contratos.',
  architecture_decisions:
    'Identifica las 3-4 decisiones arquitectonicas mas criticas del proyecto. Para cada una, un parrafo breve con la decision y por que. Luego documentamos los ADRs formales.',
}

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

type ChatPanelProps = {
  projectId: string
  section: Phase02Section
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
  const kickoffSent = useRef(false)
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const isApproved = sectionStatus === 'approved'

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new TextStreamChatTransport({
      api: `/api/projects/${projectId}/phases/2/chat`,
      body: { section },
    }),
    messages: initialMessages.map((m, i) => ({
      id: String(i),
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    })),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-kickoff: when section has no messages and is not approved, CTO starts proactively
  useEffect(() => {
    if (
      initialMessages.length === 0 &&
      !isApproved &&
      !hasDocument &&
      !kickoffSent.current
    ) {
      kickoffSent.current = true
      const kickoff = SECTION_KICKOFF[section] ?? `Como CTO, analiza y propone ${SECTION_LABELS[section]}.`
      sendMessage({ text: kickoff })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset kickoff flag when section changes
  useEffect(() => {
    kickoffSent.current = false
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

  // Extract quick-reply options from the last assistant message
  const lastAssistantText = lastMessage?.role === 'assistant' ? lastText : ''
  const { options: quickOptions } = extractOptions(lastAssistantText)
  const showQuickReplies = quickOptions.length > 0 && !isLoading && !isApproved && !sectionReady

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90_000)

    try {
      const res = await fetch(`/api/projects/${projectId}/phases/2/sections/${section}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setGenerateError(body?.error || `Error ${res.status}`)
        return
      }

      onDocumentGenerated()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setGenerateError('La generacion tardo demasiado. Intenta de nuevo.')
      } else {
        setGenerateError(err instanceof Error ? err.message : 'Error de conexion')
      }
    } finally {
      clearTimeout(timeout)
      setGenerating(false)
    }
  }

  async function handleApprove() {
    await fetch(`/api/projects/${projectId}/phases/2/sections/${section}/approve`, {
      method: 'POST',
    })
    onSectionApproved()
  }

  function handleRevision(feedback: string) {
    sendMessage({ text: feedback })
  }

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
      <AgentParticipationHeader agents={PHASE_02_AGENTS[section]} />
      {error && <ChatErrorBanner error={error} />}
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            <p className="text-sm text-violet-600 font-medium">
              El CTO esta analizando {SECTION_LABELS[section]}...
            </p>
            <p className="text-xs text-gray-400">
              Preparando propuesta basada en Discovery y Feature Specs
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const text = getTextContent(msg)
          // Hide auto-kickoff user messages (both fresh and returning sessions)
          if (msg.role === 'user' && isKickoffMessage(text)) {
            return null
          }
          const { cleanText } = extractOptions(text.replace('[SECTION_READY]', ''))
          return (
            <ChatMessage
              key={msg.id}
              role={msg.role as 'user' | 'assistant'}
              content={cleanText}
            />
          )
        })}

        {isLoading && <StreamingIndicator />}
      </div>

      {/* Generate button */}
      {sectionReady && !hasDocument && !isApproved && (
        <div className="mx-3 mb-2">
          {generateError && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">{generateError}</p>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
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
        <div className="mx-3 mb-2 rounded-lg bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          Seccion aprobada
        </div>
      )}

      {/* Quick replies */}
      {showQuickReplies && (
        <QuickReplies options={quickOptions} onSelect={handleQuickReply} />
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
