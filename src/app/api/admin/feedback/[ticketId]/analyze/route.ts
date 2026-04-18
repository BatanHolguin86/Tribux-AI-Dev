import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'
import { defaultModel } from '@/lib/ai/anthropic'
import { buildFeedbackAnalysisPrompt } from '@/lib/ai/prompts/feedback-analyst'

export const maxDuration = 30

export async function POST(
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

  const { data: messages } = await supabase
    .from('feedback_messages')
    .select('sender_type, content')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  const prompt = buildFeedbackAnalysisPrompt({
    category: ticket.category,
    subject: ticket.subject,
    messages: (messages ?? []) as Array<{ sender_type: string; content: string }>,
    userPlan: ticket.user_plan,
    userPersona: ticket.user_persona,
    pageUrl: ticket.page_url,
  })

  const { text } = await generateText({
    model: defaultModel,
    prompt,
    maxOutputTokens: 2048,
    temperature: 0.3,
  })

  // Save analysis as ai_analyst message
  await supabase.from('feedback_messages').insert({
    ticket_id: ticketId,
    sender_type: 'ai_analyst',
    content: text,
  })

  return Response.json({ analysis: text })
}
