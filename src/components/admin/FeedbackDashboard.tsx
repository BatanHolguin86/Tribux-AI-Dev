'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'

type Ticket = {
  id: string
  user_id: string
  user_name: string
  category: string
  subject: string
  status: string
  priority: string
  user_plan: string | null
  user_persona: string | null
  page_url: string | null
  created_at: string
  updated_at: string
}

type Message = {
  id: string
  sender_type: 'user' | 'admin' | 'ai_analyst'
  content: string
  image_urls: string[]
  created_at: string
}

const CATEGORY_TABS = [
  { value: '', label: 'Todos', icon: '📋' },
  { value: 'bug', label: 'Bugs', icon: '🐛' },
  { value: 'mejora', label: 'Mejoras', icon: '💡' },
  { value: 'pricing', label: 'Pricing', icon: '💰' },
  { value: 'otro', label: 'Otros', icon: '📝' },
]

const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  en_revision: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resuelto: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cerrado: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  critico: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  alto: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medio: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  bajo: 'bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-500',
}

export function FeedbackDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    const params = activeCategory ? `?category=${activeCategory}` : ''
    const res = await fetch(`/api/admin/feedback${params}`)
    if (res.ok) setTickets(await res.json())
    setLoading(false)
  }, [activeCategory])

  useEffect(() => { void loadTickets() }, [loadTickets])

  async function openTicket(ticket: Ticket) {
    setActiveTicket(ticket)
    const res = await fetch(`/api/admin/feedback/${ticket.id}/messages`)
    if (res.ok) setMessages(await res.json())
  }

  async function sendReply() {
    if (!reply.trim() || !activeTicket) return
    setSendingReply(true)
    await fetch(`/api/admin/feedback/${activeTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: reply.trim() }),
    })
    setReply('')
    const res = await fetch(`/api/admin/feedback/${activeTicket.id}/messages`)
    if (res.ok) setMessages(await res.json())
    setSendingReply(false)
  }

  async function analyzeTicket() {
    if (!activeTicket) return
    setAnalyzing(true)
    await fetch(`/api/admin/feedback/${activeTicket.id}/analyze`, { method: 'POST' })
    const res = await fetch(`/api/admin/feedback/${activeTicket.id}/messages`)
    if (res.ok) setMessages(await res.json())
    setAnalyzing(false)
  }

  async function updateStatus(status: string) {
    if (!activeTicket) return
    await fetch(`/api/admin/feedback/${activeTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setActiveTicket({ ...activeTicket, status })
    void loadTickets()
  }

  async function updatePriority(priority: string) {
    if (!activeTicket) return
    await fetch(`/api/admin/feedback/${activeTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    })
    setActiveTicket({ ...activeTicket, priority })
  }

  const categoryCounts = CATEGORY_TABS.map((tab) => ({
    ...tab,
    count: tab.value ? tickets.filter((t) => t.category === tab.value).length : tickets.length,
  }))

  const newCount = tickets.filter((t) => t.status === 'nuevo').length

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left: Ticket list */}
      <div className="flex w-80 shrink-0 flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-brand-navy">
        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h1 className="font-display text-base font-bold text-gray-900 dark:text-white">
            Feedback {newCount > 0 && <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">{newCount}</span>}
          </h1>
          <p className="mt-0.5 text-xs text-gray-400">Reportes y sugerencias de usuarios</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-3 py-2 dark:border-gray-800">
          {categoryCounts.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveCategory(tab.value); setActiveTicket(null) }}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                activeCategory === tab.value
                  ? 'bg-brand-primary text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {tab.icon} {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">Sin tickets</p>
          ) : (
            <div className="space-y-1">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTicket(t)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                    activeTicket?.id === t.id
                      ? 'bg-brand-teal/10 dark:bg-brand-primary/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{CATEGORY_TABS.find((c) => c.value === t.category)?.icon}</span>
                    <span className="flex-1 truncate text-xs font-medium text-gray-700 dark:text-gray-300">{t.subject}</span>
                    {t.status === 'nuevo' && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{t.user_name}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Ticket detail */}
      <div className="flex flex-1 flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-brand-navy">
        {!activeTicket ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-gray-400">Selecciona un ticket para ver el detalle</p>
          </div>
        ) : (
          <>
            {/* Ticket header */}
            <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">{activeTicket.subject}</h2>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{activeTicket.user_name}</span>
                    <span>·</span>
                    <span>{activeTicket.user_plan ?? 'sin plan'}</span>
                    <span>·</span>
                    <span>{activeTicket.user_persona ?? 'sin persona'}</span>
                    {activeTicket.page_url && <><span>·</span><span>{activeTicket.page_url}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={activeTicket.priority}
                    onChange={(e) => updatePriority(e.target.value)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border-0 ${PRIORITY_COLORS[activeTicket.priority]}`}
                  >
                    <option value="critico">Critico</option>
                    <option value="alto">Alto</option>
                    <option value="medio">Medio</option>
                    <option value="bajo">Bajo</option>
                  </select>
                  <select
                    value={activeTicket.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border-0 ${STATUS_COLORS[activeTicket.status]}`}
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="en_revision">En revision</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.sender_type === 'user'
                      ? 'rounded-tl-md bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      : msg.sender_type === 'admin'
                        ? 'rounded-tr-md bg-brand-primary text-white'
                        : 'rounded-tr-md border border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
                  }`}>
                    <p className="mb-1 text-[10px] font-bold opacity-60">
                      {msg.sender_type === 'user' ? 'Usuario' : msg.sender_type === 'admin' ? 'Tu respuesta' : '🤖 QA & Product Analyst'}
                    </p>
                    {msg.sender_type === 'ai_analyst' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {(msg.image_urls as string[])?.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {(msg.image_urls as string[]).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] underline opacity-70">
                            Imagen {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 p-3 dark:border-gray-800">
              <div className="mb-2 flex gap-2">
                <button
                  onClick={analyzeTicket}
                  disabled={analyzing}
                  className="flex items-center gap-1.5 rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-50 disabled:opacity-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                  {analyzing ? '🔄 Analizando...' : '🤖 Analizar con IA'}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                  placeholder="Responder al usuario..."
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-brand-primary dark:text-white"
                />
                <button
                  onClick={sendReply}
                  disabled={sendingReply || !reply.trim()}
                  className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
