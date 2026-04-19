import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Verify ticket belongs to user
  const { data: ticket } = await supabase
    .from('feedback_tickets')
    .select('id')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single()

  if (!ticket) return Response.json({ error: 'not_found' }, { status: 404 })

  const { data: messages } = await supabase
    .from('feedback_messages')
    .select('id, sender_type, content, image_urls, created_at')
    .eq('ticket_id', ticketId)
    .neq('sender_type', 'ai_analyst')
    .order('created_at', { ascending: true })

  return Response.json(messages ?? [])
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Verify ticket belongs to user
  const { data: ticket } = await supabase
    .from('feedback_tickets')
    .select('id, status')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single()

  if (!ticket) return Response.json({ error: 'not_found' }, { status: 404 })
  if (ticket.status === 'cerrado') {
    return Response.json({ error: 'Este ticket esta cerrado.' }, { status: 400 })
  }

  const body = await request.json()
  const { content, imageUrls } = body as { content: string; imageUrls?: string[] }

  if (!content?.trim()) {
    return Response.json({ error: 'Mensaje requerido.' }, { status: 400 })
  }

  await supabase.from('feedback_messages').insert({
    ticket_id: ticketId,
    sender_type: 'user',
    content: content.trim(),
    image_urls: imageUrls ?? [],
  })

  // Update ticket timestamp
  await supabase
    .from('feedback_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  return Response.json({ ok: true })
}
