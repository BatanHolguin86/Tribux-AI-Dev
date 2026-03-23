'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import type { KiroDocumentType } from '@/types/feature'
import { KIRO_DOC_LABELS, KIRO_DOC_TYPES } from '@/lib/ai/prompts/phase-01'
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

const KICKOFF_PREFIXES = [
  'Analiza brevemente el feature',
  'Para el Design KIRO de',
  'Para las Tasks de',
  'Genera el documento completo',
]

function isKickoffMessage(content: string): boolean {
  return KICKOFF_PREFIXES.some((prefix) => content.startsWith(prefix))
}

/** Only Design uses a chat kickoff; Requirements and Tasks use auto-draft */
const DESIGN_KICKOFF = (name: string) =>
  `Para el Design KIRO de "${name}": presenta tu propuesta compacta — overview (2-3 lineas), modelo de datos (tablas + campos clave), APIs (endpoints listados), y 2 decisiones arquitectonicas que necesites validar conmigo. Cierra con "Alineado? Confirma y genero el documento completo."`

/** Whether this docType uses auto-draft (direct generation, no chat) */
function isAutoDraftType(docType: KiroDocumentType): boolean {
  return docType === 'requirements' || docType === 'tasks'
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
  const [approving, setApproving] = useState(false)
  const [autoDrafting, setAutoDrafting] = useState(false)
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

  // --- Auto-draft handler for Requirements & Tasks ---
  async function handleAutoDraft() {
    setAutoDrafting(true)
    setGenerateError(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000)

    try {
      const res = await fetch(
        `/api/projects/${projectId}/phases/1/features/${featureId}/documents/${docType}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'auto-draft' }),
          signal: controller.signal,
        },
      )

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setGenerateError(body?.error || `Error ${res.status}`)
        setAutoDrafting(false)
        return
      }

      onDocumentGenerated()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setGenerateError('La generacion tardo demasiado. Intenta de nuevo.')
      } else {
        setGenerateError(err instanceof Error ? err.message : 'Error de conexion')
      }
      setAutoDrafting(false)
    } finally {
      clearTimeout(timeout)
    }
  }

  // --- Auto-kickoff logic ---
  useEffect(() => {
    if (initialMessages.length === 0 && !isApproved && !hasDocument && !kickoffSent.current) {
      kickoffSent.current = true

      if (isAutoDraftType(docType)) {
        // Requirements & Tasks: generate document directly, no chat
        handleAutoDraft()
      } else {
        // Design: send compact proposal kickoff
        sendMessage({ text: DESIGN_KICKOFF(featureName) })
      }
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

  const lastAssistantText = lastMessage?.role === 'assistant' ? lastText : ''
  const { options: quickOptions } = extractOptions(lastAssistantText)
  const showQuickReplies = quickOptions.length > 0 && !isLoading && !isApproved && !sectionReady

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000)

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
    setApproving(true)
    setGenerateError(null)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/phases/1/features/${featureId}/documents/${docType}/approve`,
        { method: 'POST' },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        if (body?.inconsistencies?.length) {
          setGenerateError(
            `Coherencia: ${body.inconsistencies.map((i: { message: string }) => i.message).join('; ')}`,
          )
        } else {
          setGenerateError(body?.error || `Error ${res.status}`)
        }
        setApproving(false)
        return
      }
      onDocumentApproved()
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Error de conexion')
      setApproving(false)
    }
  }

  function handleRevision(feedback: string) {
    // Add context prefix if document was auto-drafted and chat is empty
    const contextPrefix =
      hasDocument && messages.length <= 2
        ? `El documento de ${KIRO_DOC_LABELS[docType]} fue generado automaticamente. Solicito este ajuste: `
        : ''
    sendMessage({ text: contextPrefix + feedback })
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
  const stepIndex = KIRO_DOC_TYPES.indexOf(docType) + 1

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
            CTO
          </span>
          <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{docLabel}</span>
        </div>
        <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          Paso {stepIndex}/3
        </span>
      </div>
      {error && <ChatErrorBanner error={error} />}
      {generateError && (
        <div className="mx-3 mt-2">
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">{generateError}</p>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {/* Auto-drafting loading state (Requirements & Tasks) */}
        {autoDrafting && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-200 border-t-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Generando {docLabel} automaticamente
            </p>
            <p className="max-w-xs text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              El CTO consulta a los especialistas y redacta el documento completo.
              En segundos aparecera en el panel derecho.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Feature: {featureName}</p>
          </div>
        )}

        {/* Chat waiting state (Design only) */}
        {!autoDrafting && messages.length === 0 && !isLoading && !hasDocument && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Preparando propuesta del CTO…</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Feature: {featureName}</p>
          </div>
        )}

        {/* Document auto-drafted, chat available for refinement */}
        {!autoDrafting && hasDocument && messages.length === 0 && !isApproved && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-8 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Documento generado
            </p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              Revisa el {docLabel} en el panel derecho. Si necesitas cambios, escribe aqui lo que quieres ajustar.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const text = getTextContent(msg)
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

      {/* Generate document button (Design flow: after [SECTION_READY]) */}
      {sectionReady && !hasDocument && !isApproved && (
        <div className="mx-3 mb-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {generating ? 'Generando documento...' : `Generar documento de ${docLabel}`}
          </button>
        </div>
      )}

      {/* Approval gate (after document exists) */}
      {hasDocument && !isApproved && (
        <ApprovalGate
          sectionLabel={docLabel}
          onApprove={handleApprove}
          onRevisionRequest={handleRevision}
          isApproving={approving}
          onRegenerate={handleGenerate}
          isRegenerating={generating}
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
          isLoading={isLoading || autoDrafting}
        />
      )}
    </div>
  )
}
