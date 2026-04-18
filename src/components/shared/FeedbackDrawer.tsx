'use client'

import { useState, useEffect, useRef } from 'react'

type Ticket = {
  id: string
  category: string
  subject: string
  status: string
  created_at: string
}

type Message = {
  id: string
  sender_type: 'user' | 'admin' | 'ai_analyst'
  content: string
  image_urls: string[]
  created_at: string
}

type Category = 'bug' | 'mejora' | 'pricing' | 'otro'

const CATEGORIES: Array<{ value: Category; label: string; icon: string; description: string }> = [
  { value: 'bug', label: 'Reportar problema', icon: '🐛', description: 'Algo no funciona como deberia' },
  { value: 'mejora', label: 'Sugerir mejora', icon: '💡', description: 'Tengo una idea para mejorar Tribux AI' },
  { value: 'pricing', label: 'Pricing y planes', icon: '💰', description: 'Consulta sobre precios o tu plan' },
  { value: 'otro', label: 'Otro', icon: '📝', description: 'Cualquier otra consulta' },
]

const CONFIRMATION_MESSAGES: Record<Category, string> = {
  bug: 'Gracias por reportar este problema. Nuestro equipo lo revisara y te responderemos pronto.',
  mejora: 'Gracias por tu sugerencia. La evaluaremos para incluirla en futuras versiones de Tribux AI.',
  pricing: 'Gracias por tu comentario sobre nuestros planes. Lo revisaremos para ofrecerte la mejor experiencia.',
  otro: 'Gracias por tu mensaje. Te responderemos lo antes posible.',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Enviado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  en_revision: { label: 'En revision', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  resuelto: { label: 'Resuelto', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cerrado: { label: 'Cerrado', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

type View = 'list' | 'new' | 'detail' | 'confirmation'

export function FeedbackDrawer({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>('list')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  // New ticket state
  const [category, setCategory] = useState<Category | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmationCategory, setConfirmationCategory] = useState<Category>('otro')

  // Detail state
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/user/feedback')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Ticket[]) => setTickets(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openTicket(ticketId: string) {
    setActiveTicketId(ticketId)
    setView('detail')
    fetch(`/api/user/feedback/${ticketId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Message[]) => setMessages(data))
      .catch(() => {})
  }

  async function handleSubmit() {
    if (!category || !subject.trim() || !message.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/user/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
          pageUrl: window.location.pathname,
        }),
      })
      if (res.ok) {
        setConfirmationCategory(category)
        setView('confirmation')
        setCategory(null)
        setSubject('')
        setMessage('')
        // Refresh tickets
        const ticketsRes = await fetch('/api/user/feedback')
        if (ticketsRes.ok) setTickets(await ticketsRes.json())
      }
    } catch { /* silent */ } finally {
      setSubmitting(false)
    }
  }

  async function handleReply() {
    if (!reply.trim() || !activeTicketId) return
    setSendingReply(true)
    try {
      await fetch(`/api/user/feedback/${activeTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply.trim() }),
      })
      setReply('')
      const res = await fetch(`/api/user/feedback/${activeTicketId}/messages`)
      if (res.ok) setMessages(await res.json())
    } catch { /* silent */ } finally {
      setSendingReply(false)
    }
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-[#0A1F33] sm:ml-auto" role="dialog" aria-modal="true" aria-label="Feedback">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {view !== 'list' && view !== 'confirmation' && (
              <button
                onClick={() => { setView('list'); setActiveTicketId(null) }}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="font-display text-sm font-bold text-[#0F2B46] dark:text-white">
              {view === 'list' && 'Feedback'}
              {view === 'new' && 'Nuevo feedback'}
              {view === 'detail' && 'Conversacion'}
              {view === 'confirmation' && 'Enviado'}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* LIST VIEW */}
          {view === 'list' && (
            <div className="p-4">
              <button
                onClick={() => setView('new')}
                className="mb-4 w-full rounded-lg bg-[#0F2B46] py-2.5 text-sm font-medium text-white hover:bg-[#0A1F33]"
              >
                Nuevo feedback
              </button>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0EA5A3] border-t-transparent" />
                </div>
              ) : tickets.length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-400">Sin mensajes aun</p>
              ) : (
                <div className="space-y-2">
                  {tickets.map((t) => {
                    const statusCfg = STATUS_LABELS[t.status] ?? STATUS_LABELS.nuevo
                    const catIcon = CATEGORIES.find((c) => c.value === t.category)?.icon ?? '📝'
                    return (
                      <button
                        key={t.id}
                        onClick={() => openTicket(t.id)}
                        className="w-full rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                      >
                        <div className="flex items-center gap-2">
                          <span>{catIcon}</span>
                          <span className="flex-1 truncate text-xs font-medium text-gray-700 dark:text-gray-300">{t.subject}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {new Date(t.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* NEW TICKET VIEW */}
          {view === 'new' && (
            <div className="p-4 space-y-4">
              {!category ? (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Selecciona el tipo de feedback:</p>
                  <div className="space-y-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-[#0EA5A3]/30 hover:bg-[#E8F4F8]/50 dark:border-gray-700 dark:hover:bg-[#0F2B46]/30"
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</p>
                          <p className="text-[10px] text-gray-400">{cat.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span>{CATEGORIES.find((c) => c.value === category)?.icon}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {CATEGORIES.find((c) => c.value === category)?.label}
                    </span>
                    <button onClick={() => setCategory(null)} className="text-[10px] text-[#0EA5A3] underline">Cambiar</button>
                  </div>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Asunto (breve)"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0F2B46] dark:text-white"
                  />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe tu feedback..."
                    rows={5}
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0F2B46] dark:text-white"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !subject.trim() || !message.trim()}
                    className="w-full rounded-lg bg-[#0F2B46] py-2.5 text-sm font-medium text-white hover:bg-[#0A1F33] disabled:opacity-50"
                  >
                    {submitting ? 'Enviando...' : 'Enviar feedback'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* CONFIRMATION VIEW */}
          {view === 'confirmation' && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-[#0F2B46] dark:text-white">Recibido</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {CONFIRMATION_MESSAGES[confirmationCategory]}
              </p>
              <button
                onClick={() => setView('list')}
                className="mt-6 rounded-lg bg-[#0F2B46] px-6 py-2 text-sm font-medium text-white hover:bg-[#0A1F33]"
              >
                Ver mis tickets
              </button>
            </div>
          )}

          {/* DETAIL VIEW */}
          {view === 'detail' && (
            <div className="flex h-full flex-col">
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      msg.sender_type === 'user'
                        ? 'rounded-tr-md bg-[#0F2B46] text-white'
                        : msg.sender_type === 'admin'
                          ? 'rounded-tl-md border border-[#0EA5A3]/30 bg-[#E8F4F8] text-[#0F2B46] dark:bg-[#0F2B46] dark:text-gray-200'
                          : 'rounded-tl-md border border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
                    }`}>
                      {msg.sender_type !== 'user' && (
                        <p className="mb-1 text-[10px] font-bold opacity-60">
                          {msg.sender_type === 'admin' ? 'Equipo Tribux AI' : '🤖 QA Analyst'}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {(msg.image_urls as string[])?.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {(msg.image_urls as string[]).map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] underline">
                              Imagen {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-[9px] opacity-50">
                        {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply input */}
              <div className="border-t border-gray-200 p-3 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0F2B46] dark:text-white"
                  />
                  <button
                    onClick={handleReply}
                    disabled={sendingReply || !reply.trim()}
                    className="shrink-0 rounded-lg bg-[#0F2B46] px-3 py-2 text-white disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
