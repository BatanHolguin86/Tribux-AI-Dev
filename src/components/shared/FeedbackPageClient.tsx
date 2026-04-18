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

export function FeedbackPageClient() {
  const [view, setView] = useState<View>('list')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<Category | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmationCategory, setConfirmationCategory] = useState<Category>('otro')
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/user/feedback')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Ticket[]) => setTickets(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3)
    setImageFiles(files)
    const previews = files.map((f) => URL.createObjectURL(f))
    setImagePreviews(previews)
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  async function filesToBase64(files: File[]): Promise<string[]> {
    return Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          }),
      ),
    )
  }

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
      const imageUrls = imageFiles.length > 0 ? await filesToBase64(imageFiles) : []
      const res = await fetch('/api/user/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject: subject.trim(), message: message.trim(), imageUrls, pageUrl: '/feedback' }),
      })
      if (res.ok) {
        setConfirmationCategory(category)
        setView('confirmation')
        setCategory(null)
        setSubject('')
        setMessage('')
        setImageFiles([])
        setImagePreviews([])
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">Feedback</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Reporta problemas, sugiere mejoras o envianos tus comentarios.
          </p>
        </div>
        {view !== 'new' && view !== 'confirmation' && (
          <button
            onClick={() => { setView('new'); setCategory(null) }}
            className="rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A1F33]"
          >
            Nuevo feedback
          </button>
        )}
      </div>

      {/* CONFIRMATION */}
      {view === 'confirmation' && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-bold text-[#0F2B46] dark:text-white">Recibido</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{CONFIRMATION_MESSAGES[confirmationCategory]}</p>
          <button
            onClick={() => setView('list')}
            className="mt-6 rounded-lg bg-[#0F2B46] px-6 py-2 text-sm font-medium text-white hover:bg-[#0A1F33]"
          >
            Ver mis tickets
          </button>
        </div>
      )}

      {/* NEW TICKET */}
      {view === 'new' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <button onClick={() => setView('list')} className="mb-4 text-xs text-[#0EA5A3] hover:underline">← Volver</button>

          {!category ? (
            <>
              <h2 className="font-display text-sm font-semibold text-gray-900 dark:text-gray-100">Selecciona el tipo:</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-[#0EA5A3]/30 hover:bg-[#E8F4F8]/30 dark:border-gray-700 dark:hover:bg-[#0F2B46]/20"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</p>
                      <p className="text-[10px] text-gray-400">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span>{CATEGORIES.find((c) => c.value === category)?.icon}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{CATEGORIES.find((c) => c.value === category)?.label}</span>
                <button onClick={() => setCategory(null)} className="text-[10px] text-[#0EA5A3] underline">Cambiar</button>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto (breve)"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0F2B46] dark:text-white"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe tu feedback con el mayor detalle posible..."
                rows={6}
                aria-label="Mensaje de feedback"
                className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0F2B46] dark:text-white"
              />
              {/* Image upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  aria-label="Adjuntar imagenes"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageFiles.length >= 3}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                  </svg>
                  Adjuntar imagen ({imageFiles.length}/3)
                </button>

                {imagePreviews.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {imagePreviews.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt={`Adjunto ${i + 1}`} className="h-16 w-16 rounded-lg border border-gray-200 object-cover dark:border-gray-700" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !subject.trim() || !message.trim()}
                aria-label="Enviar feedback"
                className="w-full rounded-lg bg-[#0F2B46] py-2.5 text-sm font-medium text-white hover:bg-[#0A1F33] disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar feedback'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TICKET LIST */}
      {view === 'list' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0EA5A3] border-t-transparent" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm text-gray-400">No tienes tickets aun. Usa el boton "Nuevo feedback" para enviar tu primer reporte.</p>
            </div>
          ) : (
            tickets.map((t) => {
              const statusCfg = STATUS_LABELS[t.status] ?? STATUS_LABELS.nuevo
              const catIcon = CATEGORIES.find((c) => c.value === t.category)?.icon ?? '📝'
              return (
                <button
                  key={t.id}
                  onClick={() => openTicket(t.id)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-[#0EA5A3]/20 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{catIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{t.subject}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(t.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* TICKET DETAIL */}
      {view === 'detail' && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
            <button onClick={() => { setView('list'); setActiveTicketId(null) }} className="mb-2 text-xs text-[#0EA5A3] hover:underline">← Volver</button>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {tickets.find((t) => t.id === activeTicketId)?.subject}
            </h2>
          </div>

          <div ref={scrollRef} className="max-h-[50vh] space-y-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.sender_type === 'user'
                    ? 'rounded-tr-md bg-[#0F2B46] text-white'
                    : 'rounded-tl-md border border-[#0EA5A3]/20 bg-[#E8F4F8] text-[#0F2B46] dark:bg-[#0F2B46] dark:text-gray-200'
                }`}>
                  {msg.sender_type !== 'user' && (
                    <p className="mb-1 text-[10px] font-bold opacity-60">Equipo Tribux AI</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="mt-1 text-[9px] opacity-50">
                    {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
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
                className="shrink-0 rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
