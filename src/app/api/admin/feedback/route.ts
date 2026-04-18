import { createClient } from '@/lib/supabase/server'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'

export async function GET(request: Request) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return Response.json(auth.body, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')

  const supabase = await createClient()

  let query = supabase
    .from('feedback_tickets')
    .select('id, user_id, category, subject, status, priority, page_url, user_plan, user_persona, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)

  const { data: tickets } = await query

  // Enrich with user email
  if (tickets && tickets.length > 0) {
    const userIds = [...new Set(tickets.map((t) => t.user_id))]
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds)

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

    const enriched = tickets.map((t) => ({
      ...t,
      user_name: profileMap.get(t.user_id)?.full_name ?? 'Usuario',
    }))

    return Response.json(enriched)
  }

  return Response.json(tickets ?? [])
}
