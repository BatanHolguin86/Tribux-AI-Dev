'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { ChatMessage } from '@/components/shared/chat/ChatMessage'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'
import { ChatErrorBanner } from '@/components/shared/chat/ChatErrorBanner'
import { parseDesignGenerateCommand } from '@/lib/design/parse-design-generate-command'

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

type DesignChatProps = {
  projectId: string
  threadId: string
  initialPrompt: string
  /** After Camino A generate triggered from chat (TASK-020), refresh parent artifact list */
  onCaminoAGenerateSuccess?: () => void
}

export function DesignChat({
  projectId,
  threadId,
  initialPrompt,
  onCaminoAGenerateSuccess,
}: DesignChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const initialSentRef = useRef(false)
  const [input, setInput] = useState('')
  const [caminoAInfo, setCaminoAInfo] = useState<string | null>(null)
  const [caminoAError, setCaminoAError] = useState<string | null>(null)
  const [caminoABusy, setCaminoABusy] = useState(false)

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new TextStreamChatTransport({
      api: `/api/projects/${projectId}/agents/ui_ux_designer/threads/${threadId}/chat`,
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted' || caminoABusy

  // Auto-send the template prompt once (ref avoids setState inside effect)
  useEffect(() => {
    if (initialSentRef.current || !initialPrompt) return
    initialSentRef.current = true
    sendMessage({ text: initialPrompt })
  }, [initialPrompt, sendMessage])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  async function onSubmit() {
    const trimmed = input.trim()
    if (!trimmed) return

    const cmd = parseDesignGenerateCommand(trimmed)
    if (cmd) {
      setInput('')
      setCaminoAInfo(null)
      setCaminoAError(null)
      setCaminoABusy(true)
      try {
        const res = await fetch(`/api/projects/${projectId}/designs/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: cmd.type,
            screens: cmd.screens,
          }),
        })
        const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null
        if (!res.ok) {
          setCaminoAError(body?.message || body?.error || `Error ${res.status}`)
          return
        }
        onCaminoAGenerateSuccess?.()
        setCaminoAInfo(
          `Se guardaron ${cmd.screens.length} pantalla(s) en el proyecto. Abre la pestaña Herramientas y revisa «Diseños generados» o el detalle de cada artefacto.`,
        )
      } catch (e) {
        setCaminoAError(e instanceof Error ? e.message : 'Error de red')
      } finally {
        setCaminoABusy(false)
      }
      return
    }

    sendMessage({ text: trimmed })
    setInput('')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error && <ChatErrorBanner error={error} />}
      {(() => {
        const lastMsg = messages[messages.length - 1]
        const text = lastMsg?.role === 'assistant'
          ? (lastMsg.parts?.filter((p) => p.type === 'text').map((p) => ('text' in p && typeof p.text === 'string') ? p.text : '').join('') ?? '')
          : ''
        const match = text.match(/__STREAM_ERROR__:([\s\S]+)/)
        if (!match) return null
        let parsed: { error: string; message: string } | null = null
        try { parsed = JSON.parse(match[1]) } catch { return null }
        if (!parsed) return null
        return (
          <div className="mx-3 my-2 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300" role="alert">
            <p className="text-xs font-medium">{parsed.error === 'credits_insufficient' ? 'Creditos insuficientes' : 'Error de conexion'}</p>
            <p className="mt-0.5 text-xs opacity-80">{parsed.message}</p>
          </div>
        )
      })()}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
        {messages.length === 0 && isLoading && (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-[#0EA5A3]/30 bg-[#E8F4F8]/40 px-6 py-10 text-center dark:border-[#0F2B46]/40 dark:bg-[#0A1F33]/20">
            <div
              className="h-11 w-11 animate-pulse rounded-full bg-gradient-to-br from-[#0EA5A3] to-[#0EA5A3] opacity-80"
              aria-hidden
            />
            <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Generando la primera respuesta…
            </p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              El UI/UX Designer está leyendo el contexto del proyecto (personas, propuesta de valor y pasos de esta
              herramienta). En unos segundos verás la síntesis CTO y el entregable.
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const text = getTextContent(msg)
          return (
            <div key={msg.id}>
              <ChatMessage role={msg.role as 'user' | 'assistant'} content={text} />
              {msg.role === 'assistant' && <CopyButton content={text} />}
            </div>
          )
        })}

        {isLoading && <StreamingIndicator />}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 p-3">
        <p className="mb-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-600 dark:text-gray-300">Camino A desde el chat:</span> envía una línea
          como{' '}
          <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
            [GENERAR wireframe] Login, Dashboard
          </code>{' '}
          (tipos: <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">wireframe</code>,{' '}
          <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">mockup_lowfi</code>,{' '}
          <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">mockup_highfi</code>) para generar HTML
          persistido sin salir del hilo.
        </p>
        {caminoAError && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {caminoAError}
          </div>
        )}
        {caminoAInfo && (
          <div className="mb-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100">
            {caminoAInfo}
          </div>
        )}
        {caminoABusy && (
          <div className="mb-2 flex items-center gap-2 rounded-md border border-[#0EA5A3]/30 bg-[#E8F4F8]/80 px-3 py-2 text-xs text-[#0F2B46] dark:border-[#0F2B46]/40 dark:bg-[#0A1F33]/30 dark:text-[#E8F4F8]">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0EA5A3] border-t-transparent" />
            Generando pantallas en el servidor (Camino A)… puede tardar hasta ~1 min.
          </div>
        )}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => void onSubmit()}
          onStop={stop}
          isLoading={isLoading}
          placeholder="Pide cambios al entregable o usa [GENERAR wireframe] Pantalla1, Pantalla2…"
        />
      </div>
    </div>
  )
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-1">
      <button
        onClick={handleCopy}
        className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-400"
        title="Copiar al portapapeles"
      >
        {copied ? (
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}
