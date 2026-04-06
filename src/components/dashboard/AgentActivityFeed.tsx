import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Clock } from 'lucide-react'

const AGENT_META: Record<string, { name: string; icon: string; color: string }> = {
  cto_virtual: { name: 'CTO Virtual', icon: '⚡', color: '#0EA5A3' },
  product_architect: { name: 'Product Architect', icon: '📋', color: '#6366F1' },
  system_architect: { name: 'System Architect', icon: '🏗️', color: '#8B5CF6' },
  ui_ux_designer: { name: 'UI/UX Designer', icon: '🎨', color: '#EC4899' },
  lead_developer: { name: 'Lead Developer', icon: '💻', color: '#0EA5A3' },
  db_admin: { name: 'DB Admin', icon: '🗄️', color: '#F59E0B' },
  qa_engineer: { name: 'QA Engineer', icon: '🧪', color: '#10B981' },
  devops_engineer: { name: 'DevOps Engineer', icon: '🚀', color: '#F97316' },
  operator: { name: 'Operator', icon: '⚙️', color: '#94A3B8' },
}

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMin = Math.round((now - then) / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.round(diffH / 24)
  return `${diffD}d`
}

export async function AgentActivityFeed() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: threads } = await supabase
    .from('conversation_threads')
    .select(
      'id, project_id, agent_type, title, message_count, last_message_at, projects(name, current_phase)',
    )
    .order('last_message_at', { ascending: false })
    .limit(5)

  if (!threads?.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-[#0F2B46]">
        <h3 className="mb-3 font-display text-sm font-semibold text-[#0F2B46] dark:text-white">
          Actividad de agentes
        </h3>
        <p className="text-sm text-[#94A3B8]">
          Sin actividad reciente. Inicia una conversación con un agente en el tab Equipo de un proyecto.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-[#0F2B46]">
      <h3 className="mb-3 font-display text-sm font-semibold text-[#0F2B46] dark:text-white">
        Actividad reciente
      </h3>
      <div className="space-y-3">
        {threads.map((thread) => {
          const agent = AGENT_META[thread.agent_type] ?? {
            name: thread.agent_type,
            icon: '🤖',
            color: '#6B7280',
          }
          const proj = thread.projects as { name?: string; current_phase?: number } | null
          const projectName = proj?.name ?? 'Proyecto'
          const phaseNum = String(proj?.current_phase ?? 0).padStart(2, '0')
          const timeAgo = getRelativeTime(thread.last_message_at)

          return (
            <Link
              key={thread.id}
              href={`/projects/${thread.project_id}/phase/${phaseNum}`}
              className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                style={{ backgroundColor: `${agent.color}18` }}
              >
                {agent.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0F2B46] dark:text-white">
                  {agent.name} <span className="font-normal text-[#94A3B8]">en</span> {projectName}
                </p>
                <p className="truncate text-xs text-[#94A3B8]">
                  {thread.title ?? `${thread.message_count} mensajes`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-[10px] text-[#94A3B8]">
                <Clock className="h-3 w-3" aria-hidden />
                {timeAgo}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
