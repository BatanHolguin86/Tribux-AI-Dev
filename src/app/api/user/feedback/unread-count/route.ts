import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/user/feedback/unread-count
 * Returns count of tickets where the admin has replied but the user hasn't responded yet.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ count: 0 })

  // Get user's open tickets (not cerrado)
  const { data: tickets } = await supabase
    .from('feedback_tickets')
    .select('id')
    .eq('user_id', user.id)
    .neq('status', 'cerrado')

  if (!tickets || tickets.length === 0) return Response.json({ count: 0 })

  // For each ticket, check if the latest message is from admin
  const ticketIds = tickets.map((t) => t.id)

  const { data: messages } = await supabase
    .from('feedback_messages')
    .select('ticket_id, sender_type, created_at')
    .in('ticket_id', ticketIds)
    .neq('sender_type', 'ai_analyst')
    .order('created_at', { ascending: false })

  // Group by ticket, check if latest message is from admin
  const latestByTicket = new Map<string, string>()
  for (const msg of messages ?? []) {
    if (!latestByTicket.has(msg.ticket_id)) {
      latestByTicket.set(msg.ticket_id, msg.sender_type)
    }
  }

  const unreadCount = [...latestByTicket.values()].filter((type) => type === 'admin').length

  return Response.json({ count: unreadCount })
}
