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

  const { data: ticket } = await supabase
    .from('feedback_tickets')
    .select('*')
    .eq('id', ticketId)
    .single()

  if (!ticket) return Response.json({ error: 'not_found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', ticket.user_id)
    .single()

  return Response.json({ ...ticket, user_name: profile?.full_name ?? 'Usuario' })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return Response.json(auth.body, { status: auth.status })

  const { ticketId } = await params
  const body = await request.json()
  const { status, priority } = body as { status?: string; priority?: string }

  const supabase = await createClient()

  const update: Record<string, string> = { updated_at: new Date().toISOString() }
  if (status) update.status = status
  if (priority) update.priority = priority

  await supabase.from('feedback_tickets').update(update).eq('id', ticketId)

  return Response.json({ ok: true })
}
