'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ChatInput } from '@/components/shared/chat/ChatInput'
import { ChatMessage } from '@/components/shared/chat/ChatMessage'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'
import { ChatErrorBanner } from '@/components/shared/chat/ChatErrorBanner'
import { EmptyResponseBanner } from '@/components/shared/chat/EmptyResponseBanner'
import { MARKETING_MODES, type MarketingMode } from '@/lib/ai/prompts/marketing-strategist'

type Thread = {
  id: string
  title: string | null
  mode: MarketingMode
  created_at: string
  updated_at: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const MODE_COLORS: Record<MarketingMode, string> = {
  brand: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  gtm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  content: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  growth: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  sales: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  competitive: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
}

const SUGGESTIONS: Record<MarketingMode, string[]> = {
  brand: [
    'Define el positioning statement de Tribux AI',
    'Crea el messaging framework por persona',
    'Propón la voz y tono de la marca',
  ],
  gtm: [
    'Diseña el funnel de adquisición por canal',
    'Propón la estrategia de lanzamiento Q2 2026',
    'Valida el pricing por segmento',
  ],
  content: [
    'Genera clusters de keywords SEO para Tribux AI',
    'Crea un calendario editorial de 12 semanas',
    'Escribe copy para la landing page principal',
  ],
  growth: [
    'Propón 5 experimentos de crecimiento priorizados',
    'Diseña un referral program para Tribux AI',
    'Optimiza el onboarding para activación',
  ],
  sales: [
    'Crea un playbook de venta para founders (Santiago)',
    'Documenta las objeciones más comunes y respuestas',
    'Diseña el email sequence de nurturing',
  ],
  competitive: [
    'Crea battle card: Tribux AI vs Bolt/Lovable',
    'Matriz comparativa completa del mercado',
    'Talking points para conversaciones con prospects',
  ],
}

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

export function MarketingChat() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<MarketingMode>('brand')
  const [input, setInput] = useState('')
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [savingArtifact, setSavingArtifact] = useState(false)

  // Load threads
  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/marketing/threads')
      if (res.ok) {
        const data = await res.json()
        setThreads(data)
      }
    } catch {
      // silent
    } finally {
      setLoadingThreads(false)
    }
  }, [])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  // Load messages when active thread changes
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    if (!activeThreadId) {
      setInitialMessages([])
      return
    }
    setLoadingMessages(true)
    fetch(`/api/admin/marketing/threads/${activeThreadId}`)
      .then((res) => res.json())
      .then((data) => {
        const msgs = (data.messages as Message[]) ?? []
        setInitialMessages(
          msgs.map((m, i) => ({
            id: m.id ?? String(i),
            role: m.role as 'user' | 'assistant',
            parts: [{ type: 'text' as const, text: m.content }],
          })),
        )
        if (data.mode) setActiveMode(data.mode)
      })
      .catch(() => setInitialMessages([]))
      .finally(() => setLoadingMessages(false))
  }, [activeThreadId])

  // Chat hook — uses custom transport that sends threadId + mode in the body
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    id: activeThreadId ?? 'new',
    transport: new DefaultChatTransport({
      api: '/api/admin/marketing/chat',
      body: { threadId: activeThreadId, mode: activeMode },
    }),
    messages: initialMessages,
    onFinish() {
      void loadThreads()
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Empty response detection
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

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Create new thread
  async function createThread() {
    try {
      const res = await fetch('/api/admin/marketing/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: activeMode }),
      })
      if (res.ok) {
        const thread = await res.json()
        setThreads((prev) => [thread, ...prev])
        setActiveThreadId(thread.id)
        setMessages([])
        return thread.id as string
      }
    } catch {
      // silent
    }
    return null
  }

  async function onSubmit() {
    if (!input.trim()) return

    let threadId = activeThreadId
    if (!threadId) {
      threadId = await createThread()
      if (!threadId) return
    }

    sendMessage({ text: input })
    setInput('')
  }

  function handleSuggestionClick(text: string) {
    setInput(text)
  }

  // Save last assistant message as artifact
  async function saveAsArtifact() {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistant) return

    const content = getTextContent(lastAssistant)
    if (!content.trim()) return

    setSavingArtifact(true)
    try {
      const modeToType: Record<MarketingMode, string> = {
        brand: 'brand_strategy',
        gtm: 'gtm_plan',
        content: 'content_strategy',
        growth: 'growth_experiment',
        sales: 'sales_playbook',
        competitive: 'competitive_messaging',
      }

      const title = content.split('\n')[0]?.replace(/^#+\s*/, '').slice(0, 100) || 'Sin titulo'
      await fetch('/api/admin/marketing/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThreadId,
          title,
          type: modeToType[activeMode],
          content,
        }),
      })
    } catch {
      // silent
    } finally {
      setSavingArtifact(false)
    }
  }

  // Delete thread
  async function deleteThread(threadId: string) {
    try {
      await fetch(`/api/admin/marketing/threads/${threadId}`, { method: 'DELETE' })
      setThreads((prev) => prev.filter((t) => t.id !== threadId))
      if (activeThreadId === threadId) {
        setActiveThreadId(null)
        setMessages([])
      }
    } catch {
      // silent
    }
  }

  const chipSuggestions = SUGGESTIONS[activeMode]

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar — Thread list */}
      <div className="flex w-72 shrink-0 flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-brand-navy">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conversaciones</h3>
          <button
            onClick={() => { setActiveThreadId(null); setMessages([]) }}
            className="rounded-lg p-1.5 text-brand-teal hover:bg-brand-teal/10 transition-colors"
            title="Nueva conversacion"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingThreads && (
            <div className="flex items-center justify-center py-8 text-xs text-gray-400">Cargando...</div>
          )}
          {!loadingThreads && threads.length === 0 && (
            <div className="flex items-center justify-center py-8 text-xs text-gray-400 dark:text-gray-500">
              Sin conversaciones aun
            </div>
          )}
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                activeThreadId === thread.id
                  ? 'bg-brand-teal/10 text-brand-teal'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => setActiveThreadId(thread.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {thread.title || 'Nueva conversacion'}
                </p>
                <span className={`inline-block mt-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${MODE_COLORS[thread.mode as MarketingMode] ?? MODE_COLORS.brand}`}>
                  {MARKETING_MODES[thread.mode as MarketingMode]?.label ?? thread.mode}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); void deleteThread(thread.id) }}
                className="hidden group-hover:block rounded p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                title="Eliminar hilo"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-brand-navy">
        {/* Mode selector */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800 overflow-x-auto">
          {(Object.keys(MARKETING_MODES) as MarketingMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeMode === mode
                  ? MODE_COLORS[mode]
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {MARKETING_MODES[mode].label}
            </button>
          ))}

          {/* Save as artifact button */}
          {messages.some((m) => m.role === 'assistant') && (
            <button
              onClick={() => void saveAsArtifact()}
              disabled={savingArtifact}
              className="ml-auto shrink-0 flex items-center gap-1.5 rounded-lg border border-brand-teal/30 px-3 py-1 text-xs font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
              {savingArtifact ? 'Guardando...' : 'Guardar artefacto'}
            </button>
          )}
        </div>

        {/* Messages */}
        {error && <ChatErrorBanner error={error} />}
        {emptyResponseError && !error && <EmptyResponseBanner />}

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
          {loadingMessages && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              Cargando mensajes...
            </div>
          )}

          {!loadingMessages && messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-brand-teal/10 p-4">
                <svg className="h-8 w-8 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Marketing Strategist — {MARKETING_MODES[activeMode].label}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center max-w-md">
                {MARKETING_MODES[activeMode].description}
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const text = getTextContent(msg)
            if (!text) return null
            return (
              <ChatMessage
                key={msg.id}
                role={msg.role as 'user' | 'assistant'}
                content={text}
                agentName={msg.role === 'assistant' ? 'Marketing Strategist' : undefined}
                agentIcon={msg.role === 'assistant' ? '📊' : undefined}
              />
            )
          })}

          {isLoading && <StreamingIndicator />}
        </div>

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => void onSubmit()}
          onStop={stop}
          isLoading={isLoading}
          placeholder={`Pregunta sobre ${MARKETING_MODES[activeMode].label.toLowerCase()}...`}
          suggestionChips={chipSuggestions}
          suggestionChipsVisible={messages.length === 0 && !isLoading}
          onSuggestionSelect={handleSuggestionClick}
        />
      </div>
    </div>
  )
}
