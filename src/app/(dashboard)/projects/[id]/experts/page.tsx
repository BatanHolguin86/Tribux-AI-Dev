import { createClient } from '@/lib/supabase/server'
import { AgentsAdvancedLayout } from '@/components/agents/AgentsAdvancedLayout'
import { AGENTS, isAgentAccessible } from '@/lib/ai/agents'
import type { Plan } from '@/types/user'

export default async function ExpertsAgentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user!.id)
    .single()

  const userPlan = (profile?.plan ?? 'starter') as Plan

  const { data: threads } = await supabase
    .from('conversation_threads')
    .select('agent_type')
    .eq('project_id', projectId)

  const threadCounts: Record<string, number> = {}
  for (const t of threads ?? []) {
    threadCounts[t.agent_type] = (threadCounts[t.agent_type] ?? 0) + 1
  }

  // Load CTO threads initially
  const { data: ctoThreads } = await supabase
    .from('conversation_threads')
    .select('id, title, message_count, last_message_at, messages')
    .eq('project_id', projectId)
    .eq('agent_type', 'cto_virtual')
    .order('last_message_at', { ascending: false })

  const agents = AGENTS.map((agent) => ({
    id: agent.id,
    name: agent.name,
    icon: agent.icon,
    specialty: agent.specialty,
    description: agent.description,
    planRequired: agent.planRequired,
    accessible: isAgentAccessible(agent.planRequired, userPlan),
    threadCount: threadCounts[agent.id] ?? 0,
  }))

  const initialThreads = (ctoThreads ?? []).map((t) => {
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

  return (
    <AgentsAdvancedLayout
      projectId={projectId}
      agents={agents}
      initialThreads={initialThreads}
    />
  )
}

