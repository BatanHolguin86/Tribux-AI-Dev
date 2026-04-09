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
import { EmptyResponseBanner } from '@/components/shared/chat/EmptyResponseBanner'
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
  documentStatus?: string | null
  onSectionApproved: () => void
  onDocumentGenerated: () => void
}

export function ChatPanel({
  projectId,
  section,
  sectionStatus,
  initialMessages,
  hasDocument,
  documentStatus,
  onSectionApproved,
  onDocumentGenerated,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const kickoffSent = useRef(false)
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const isApproved = sectionStatus === 'approved' || documentStatus === 'approved'

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

  // Detect mid-stream errors (e.g. credits exhausted during streaming)
  const streamError = (() => {
    const match = lastText.match(/__STREAM_ERROR__:([\s\S]+)/)
    if (!match) return null
    try { return JSON.parse(match[1]) as { error: string; message: string } } catch { return null }
  })()

  // Extract quick-reply options from the last assistant message
  const lastAssistantText = lastMessage?.role === 'assistant' ? lastText : ''
  const { options: quickOptions } = extractOptions(lastAssistantText)
  const showQuickReplies = quickOptions.length > 0 && !isLoading && !isApproved && !sectionReady

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/phases/2/sections/${section}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setGenerateError(body?.error || `Error ${res.status}`)
        return
      }

      // Collect streamed text
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullText += decoder.decode(value, { stream: true })
        }
      }

      if (!fullText.trim()) {
        setGenerateError('La generacion no produjo contenido.')
        return
      }

      // Save the document via dedicated endpoint (reliable, no serverless timeout)
      const saveRes = await fetch(
        `/api/projects/${projectId}/phases/2/sections/${section}/save`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: fullText }),
        },
      )

      if (!saveRes.ok) {
        setGenerateError('Documento generado pero no se pudo guardar. Intenta de nuevo.')
        return
      }

      onDocumentGenerated()
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Error de conexion')
    } finally {
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
      {emptyResponseError && !error && <EmptyResponseBanner />}
      {streamError && (
        <div className="mx-3 my-2 rounded-lg border-l-4 border-[#F59E0B]/30 bg-[#F59E0B]/5 p-3 text-sm text-[#F59E0B] dark:text-[#F59E0B]" role="alert">
          <p className="text-xs font-medium">
            {streamError.error === 'credits_insufficient' ? 'Creditos insuficientes' : 'Error de conexion'}
          </p>
          <p className="mt-0.5 text-xs opacity-80">{streamError.message}</p>
        </div>
      )}
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0EA5A3]/30 border-t-[#0F2B46]" />
            <p className="text-sm text-[#0F2B46] font-medium">
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
