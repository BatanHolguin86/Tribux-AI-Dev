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

const DESIGN_KICKOFF = (name: string) =>
  `Para el Design KIRO de "${name}": presenta tu propuesta compacta — overview (2-3 lineas), modelo de datos (tablas + campos clave), APIs (endpoints listados), y 2 decisiones arquitectonicas que necesites validar conmigo. Cierra con "Alineado? Confirma y genero el documento completo."`

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
  onDocumentApproved: (nextDocument: KiroDocumentType | null) => void
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
  const [showRevision, setShowRevision] = useState(false)
  const [feedback, setFeedback] = useState('')
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

  useEffect(() => {
    if (initialMessages.length === 0 && !isApproved && !hasDocument && !kickoffSent.current) {
      kickoffSent.current = true
      if (isAutoDraftType(docType)) {
        handleAutoDraft()
      } else {
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
      const data = await res.json()
      onDocumentApproved((data.next_document as KiroDocumentType) ?? null)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Error de conexion')
      setApproving(false)
    }
  }

  function handleRevision(text: string) {
    const contextPrefix =
      hasDocument && messages.length <= 2
        ? `El documento de ${KIRO_DOC_LABELS[docType]} fue generado automaticamente. Solicito este ajuste: `
        : ''
    sendMessage({ text: contextPrefix + text })
    setShowRevision(false)
    setFeedback('')
  }

  function onSubmit() {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  const docLabel = KIRO_DOC_LABELS[docType]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* ── Error banners ── */}
      {error && <ChatErrorBanner error={error} />}
      {generateError && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2.5 dark:border-red-900/30 dark:bg-red-950/20">
          <p className="text-xs leading-relaxed text-red-700 dark:text-red-300">{generateError}</p>
        </div>
      )}

      {/* ── Chat messages ── */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* Auto-drafting state */}
        {autoDrafting && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-violet-200 border-t-violet-600" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Generando {docLabel}...
            </p>
            <p className="max-w-xs text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              El CTO consulta especialistas y redacta el documento.
            </p>
          </div>
        )}

        {/* Design waiting state */}
        {!autoDrafting && messages.length === 0 && !isLoading && !hasDocument && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Preparando propuesta...</p>
          </div>
        )}

        {/* Document generated, ready for review */}
        {!autoDrafting && hasDocument && messages.length === 0 && !isApproved && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-6 py-8 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {docLabel} generado
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Revisa en el panel derecho. Aprueba o pide cambios abajo.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const text = getTextContent(msg)
          if (msg.role === 'user' && isKickoffMessage(text)) return null
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

      {showQuickReplies && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <QuickReplies options={quickOptions} onSelect={(o) => sendMessage({ text: o })} />
        </div>
      )}

      {/* ── Bottom action area ── */}
      <div className="border-t border-gray-100 dark:border-gray-800">
        {/* Generate button (Design: after chat confirms) */}
        {sectionReady && !hasDocument && !isApproved && (
          <div className="px-4 py-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generando...
                </>
              ) : (
                `Generar ${docLabel}`
              )}
            </button>
          </div>
        )}

        {/* Approval actions */}
        {hasDocument && !isApproved && (
          <div className="space-y-2 px-4 py-3">
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={approving || generating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {approving ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Aprobar {docLabel}
                  </>
                )}
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || approving}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Regenerar documento"
              >
                {generating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>

            {/* Revision toggle */}
            {!showRevision ? (
              <button
                onClick={() => setShowRevision(true)}
                className="w-full rounded-xl border border-dashed border-gray-200 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
              >
                Pedir cambios antes de aprobar
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Describe los cambios..."
                  autoFocus
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && feedback.trim()) handleRevision(feedback)
                    if (e.key === 'Escape') { setShowRevision(false); setFeedback('') }
                  }}
                />
                <button
                  onClick={() => feedback.trim() && handleRevision(feedback)}
                  disabled={!feedback.trim()}
                  className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-40"
                >
                  Enviar
                </button>
                <button
                  onClick={() => { setShowRevision(false); setFeedback('') }}
                  className="rounded-xl border border-gray-200 px-2.5 py-2 text-gray-400 transition-colors hover:text-gray-600 dark:border-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Approved state */}
        {isApproved && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {docLabel} aprobado
          </div>
        )}

        {/* Chat input (always available unless approved) */}
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
    </div>
  )
}
