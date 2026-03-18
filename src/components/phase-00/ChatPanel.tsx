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
import { AgentParticipationHeader } from '@/components/shared/AgentParticipationHeader'
import { QuickReplies, extractOptions } from '@/components/shared/chat/QuickReplies'
import { PHASE_00_AGENTS } from '@/lib/ai/agents/phase-agents'

const KICKOFF_PREFIXES_P00 = ['Arrancamos con', 'Vamos con', 'Trabajemos la', 'Definamos Success', 'Hagamos el', 'Hola, estoy listo', 'Necesito definir', 'Quiero trabajar', 'Vamos a definir', 'Es momento del']

function isKickoffMessage(content: string): boolean {
  return KICKOFF_PREFIXES_P00.some((prefix) => content.startsWith(prefix))
}

const SECTION_KICKOFF: Record<string, string> = {
  problem_statement: 'Arrancamos con el Problem Statement. Dame tu analisis inicial del problema que resolvemos y las 2-3 preguntas clave que necesitas para afinar la definicion.',
  personas: 'Vamos con User Personas. Propone las personas que identificas del contexto del proyecto y preguntame lo que necesites para refinarlas.',
  value_proposition: 'Trabajemos la Value Proposition. Dame tu lectura de la propuesta de valor basada en lo que ya sabemos, y que necesitas validar conmigo.',
  metrics: 'Definamos Success Metrics. Propone las metricas clave que ves para este proyecto y preguntame lo que necesites.',
  competitive_analysis: 'Hagamos el Competitive Analysis. Dame tu vision del landscape competitivo y las preguntas que necesitas para completar el analisis.',
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

  // Extract quick-reply options from the last assistant message
  const lastAssistantText = lastMessage?.role === 'assistant' ? lastText : ''
  const { options: quickOptions } = extractOptions(lastAssistantText)
  const showQuickReplies = quickOptions.length > 0 && !isLoading && !isApproved && !sectionReady

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
      <AgentParticipationHeader agents={PHASE_00_AGENTS[section]} />
      {error && <ChatErrorBanner error={error} />}
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
              <svg className="h-5 w-5 text-violet-500 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
              Preparando la sesion de {SECTION_LABELS[section]}...
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
        <div className="mx-4 mb-3">
          {generateError && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">{generateError}</p>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-violet-700 hover:to-violet-800 disabled:opacity-50"
          >
            {generating ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generando documento...
              </>
            ) : (
              `Generar documento de ${SECTION_LABELS[section]}`
            )}
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
        <div className="mx-4 mb-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-emerald-700">Seccion aprobada</span>
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
