'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import type { KiroDocumentType } from '@/types/feature'
import { KIRO_DOC_LABELS } from '@/lib/ai/prompts/phase-01'
import { ChatMessage } from '@/components/shared/chat/ChatMessage'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'
import { ChatErrorBanner } from '@/components/shared/chat/ChatErrorBanner'
import { ApprovalGate } from '@/components/shared/ApprovalGate'
import { QuickReplies, extractOptions } from '@/components/shared/chat/QuickReplies'

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

const KICKOFF_PREFIXES = ['Analiza brevemente el feature', 'Para el Design de', 'Para las Tasks de']

function isKickoffMessage(content: string): boolean {
  return KICKOFF_PREFIXES.some((prefix) => content.startsWith(prefix))
}

const KICKOFF_MESSAGES: Record<KiroDocumentType, (name: string) => string> = {
  requirements: (name) =>
    `Analiza brevemente el feature "${name}" basandote en el Discovery. Dame tu lectura estrategica en 3-4 parrafos cortos: que es critico de este feature, que riesgos ves, y cual es tu enfoque recomendado. NO generes el documento completo aun — primero alineemos la vision.`,
  design: (name) =>
    `Para el Design KIRO de "${name}" (solo esta pestana, no tasks): en 2-3 parrafos cortos propone overview, piezas clave de datos/API/UI y 2 riesgos. Objetivo: alinear contorno y cerrar con documento formal — evitemos bucle de detalle infinito en el chat.`,
  tasks: (name) =>
    `Para las Tasks de "${name}", dame una vista general: cuantas tasks estimas, como las agruparias y cual es la ruta critica. Resumen breve, luego detallamos juntos.`,
}

type KiroChatProps = {
  projectId: string
  featureId: string
  featureName: string
  docType: KiroDocumentType
  docStatus: string | null
  initialMessages: Array<{ role: string; content: string }>
  hasDocument: boolean
  onDocumentGenerated: () => void
  onDocumentApproved: () => void
}

export function KiroChat({
  projectId,
  featureId,
  featureName,
  docType,
  docStatus,
  initialMessages,
  hasDocument,
  onDocumentGenerated,
  onDocumentApproved,
}: KiroChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const kickoffSent = useRef(false)
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const isApproved = docStatus === 'approved'

  const section = `feature_${featureId}_${docType}`

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new TextStreamChatTransport({
      api: `/api/projects/${projectId}/phases/1/features/${featureId}/chat`,
      body: { section, docType },
    }),
    messages: initialMessages.map((m, i) => ({
      id: String(i),
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    })),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-kickoff: when chat is empty and doc not approved, CTO starts proactively
  useEffect(() => {
    if (
      initialMessages.length === 0 &&
      !isApproved &&
      !hasDocument &&
      !kickoffSent.current
    ) {
      kickoffSent.current = true
      const kickoffText = KICKOFF_MESSAGES[docType](featureName)
      sendMessage({ text: kickoffText })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

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
      const res = await fetch(
        `/api/projects/${projectId}/phases/1/features/${featureId}/documents/${docType}/generate`,
        { method: 'POST', signal: controller.signal },
      )

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setGenerateError(body?.error || `Error ${res.status}`)
        return
      }

      onDocumentGenerated()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setGenerateError('La generacion tardo demasiado. Intenta de nuevo — si persiste, simplifica la conversacion.')
      } else {
        setGenerateError(err instanceof Error ? err.message : 'Error de conexion')
      }
    } finally {
      clearTimeout(timeout)
      setGenerating(false)
    }
  }

  async function handleApprove() {
    await fetch(
      `/api/projects/${projectId}/phases/1/features/${featureId}/documents/${docType}/approve`,
      { method: 'POST' },
    )
    onDocumentApproved()
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

  const docLabel = KIRO_DOC_LABELS[docType]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">CTO Orquestador</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">· {docLabel}</span>
      </div>
      {error && <ChatErrorBanner error={error} />}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            <p className="text-sm text-violet-600 font-medium">
              El CTO esta analizando &quot;{featureName}&quot;...
            </p>
            <p className="text-xs text-gray-400">
              Preparando {docLabel} basado en el Discovery aprobado
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const text = getTextContent(msg)
          // Hide auto-kickoff user messages
          if (msg.role === 'user' && isKickoffMessage(text)) {
            return null
          }
          // Strip options block and [SECTION_READY] from displayed text
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

      {sectionReady && !hasDocument && !isApproved && (
        <div className="mx-3 mb-2">
          {generateError && (
            <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{generateError}</p>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {generating ? 'Generando documento...' : `Generar documento de ${docLabel}`}
          </button>
        </div>
      )}

      {hasDocument && !isApproved && (
        <ApprovalGate
          sectionLabel={docLabel}
          onApprove={handleApprove}
          onRevisionRequest={handleRevision}
          isApproving={false}
        />
      )}

      {isApproved && (
        <div className="mx-3 mb-2 rounded-lg bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          {docLabel} aprobado
        </div>
      )}

      {showQuickReplies && (
        <QuickReplies options={quickOptions} onSelect={handleQuickReply} />
      )}

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
