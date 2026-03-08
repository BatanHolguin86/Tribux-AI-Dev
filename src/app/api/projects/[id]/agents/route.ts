import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AGENTS, isAgentAccessible } from '@/lib/ai/agents'
import type { Plan } from '@/types/user'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const userPlan = (profile?.plan ?? 'starter') as Plan

  // Count threads per agent type
  const { data: threads } = await supabase
    .from('conversation_threads')
    .select('agent_type')
    .eq('project_id', projectId)

  const threadCounts: Record<string, number> = {}
  for (const t of threads ?? []) {
    threadCounts[t.agent_type] = (threadCounts[t.agent_type] ?? 0) + 1
  }

  const agents = AGENTS.map((agent) => ({
    id: agent.id,
    name: agent.name,
    icon: agent.icon,
    specialty: agent.specialty,
    description: agent.description,
    plan_required: agent.planRequired,
    accessible: isAgentAccessible(agent.planRequired, userPlan),
    thread_count: threadCounts[agent.id] ?? 0,
  }))

  return NextResponse.json({ agents })
}
