import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AGENT_MAP } from '@/lib/ai/agents'
import { canUseAgent } from '@/lib/plans/guards'
import type { AgentType } from '@/types/agent'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; agentType: string }> },
) {
  const { id: projectId, agentType } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: threads } = await supabase
    .from('conversation_threads')
    .select('id, title, message_count, last_message_at, messages')
    .eq('project_id', projectId)
    .eq('agent_type', agentType)
    .order('last_message_at', { ascending: false })

  const result = (threads ?? []).map((t) => {
    const msgs = t.messages as Array<{ role: string; content: string }> | null
    const lastMsg = msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null
    return {
      id: t.id,
      title: t.title,
      message_count: t.message_count,
      last_message_at: t.last_message_at,
      preview: lastMsg ? lastMsg.content.slice(0, 100) : null,
    }
  })

  return NextResponse.json({ threads: result })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; agentType: string }> },
) {
  const { id: projectId, agentType } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Validate agent access
  const agent = AGENT_MAP[agentType as AgentType]
  if (!agent) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single()

  if (!profile || !canUseAgent(agentType, agent.planRequired, profile)) {
    return NextResponse.json(
      { error: 'plan_required', message: 'Tu plan no incluye acceso a este agente. Upgrade para continuar.' },
      { status: 403 },
    )
  }

  const { data: thread, error } = await supabase
    .from('conversation_threads')
    .insert({
      project_id: projectId,
      agent_type: agentType,
      messages: [],
      message_count: 0,
    })
    .select('id, agent_type')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(thread, { status: 201 })
}
