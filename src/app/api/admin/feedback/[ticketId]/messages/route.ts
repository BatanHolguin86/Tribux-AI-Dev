import { createClient } from '@/lib/supabase/server'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return Response.json(auth.body, { status: auth.status })

  const { ticketId } = await params
  const supabase = await createClient()

  const { data: messages } = await supabase
    .from('feedback_messages')
    .select('id, sender_type, content, image_urls, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  return Response.json(messages ?? [])
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return Response.json(auth.body, { status: auth.status })

  const { ticketId } = await params
  const body = await request.json()
  const { content } = body as { content: string }

  if (!content?.trim()) {
    return Response.json({ error: 'Mensaje requerido.' }, { status: 400 })
  }

  const supabase = await createClient()

  await supabase.from('feedback_messages').insert({
    ticket_id: ticketId,
    sender_type: 'admin',
    content: content.trim(),
  })

  // Update ticket status to en_revision if nuevo
  await supabase
    .from('feedback_tickets')
    .update({ status: 'en_revision', updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('status', 'nuevo')

  return Response.json({ ok: true })
}
