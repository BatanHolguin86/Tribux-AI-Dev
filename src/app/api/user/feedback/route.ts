import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: tickets } = await supabase
    .from('feedback_tickets')
    .select('id, category, subject, status, priority, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return Response.json(tickets ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await request.json()
  const { category, subject, message, imageUrls, pageUrl } = body as {
    category: string
    subject: string
    message: string
    imageUrls?: string[]
    pageUrl?: string
  }

  if (!category || !subject?.trim() || !message?.trim()) {
    return Response.json({ error: 'Categoria, asunto y mensaje son requeridos.' }, { status: 400 })
  }

  const validCategories = ['bug', 'mejora', 'pricing', 'otro']
  if (!validCategories.includes(category)) {
    return Response.json({ error: 'Categoria invalida.' }, { status: 400 })
  }

  // Get user profile for context
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, persona')
    .eq('id', user.id)
    .single()

  // Create ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('feedback_tickets')
    .insert({
      user_id: user.id,
      category,
      subject: subject.trim(),
      status: 'nuevo',
      priority: category === 'bug' ? 'alto' : 'medio',
      page_url: pageUrl ?? null,
      user_plan: profile?.plan ?? null,
      user_persona: profile?.persona ?? null,
    })
    .select('id')
    .single()

  if (ticketError || !ticket) {
    return Response.json({ error: 'Error al crear el ticket.' }, { status: 500 })
  }

  // Create first message
  await supabase.from('feedback_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'user',
    content: message.trim(),
    image_urls: imageUrls ?? [],
  })

  return Response.json({ id: ticket.id, category })
}
