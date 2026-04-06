import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShieldAlert } from 'lucide-react'
import { PHASE_NAMES } from '@/types/project'

export async function PendingGatesCard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProjects } = await supabase.from('projects').select('id').eq('user_id', user.id)
  const projectIds = (userProjects ?? []).map((p) => p.id)
  if (projectIds.length === 0) return null

  const { data: pendingGates } = await supabase
    .from('project_phases')
    .select('id, project_id, phase_number, status, approved_at, projects(name)')
    .in('project_id', projectIds)
    .eq('status', 'completed')
    .is('approved_at', null)
    .limit(8)

  if (!pendingGates?.length) return null

  return (
    <div className="rounded-xl border-2 border-[#F59E0B]/30 bg-[#F59E0B]/5 p-5 dark:bg-[#F59E0B]/10">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 shrink-0 text-[#F59E0B]" aria-hidden />
        <h3 className="font-display text-sm font-semibold text-[#0F2B46] dark:text-white">
          Pendiente tu aprobación
        </h3>
        <span className="rounded-full bg-[#F59E0B] px-2 py-0.5 text-[10px] font-bold text-white">
          {pendingGates.length}
        </span>
      </div>
      <div className="space-y-2">
        {pendingGates.map((gate) => {
          const phaseNum = String(gate.phase_number).padStart(2, '0')
          const proj = gate.projects as { name?: string } | null
          const projectName = proj?.name ?? 'Proyecto'
          return (
            <Link
              key={gate.id}
              href={`/projects/${gate.project_id}/phase/${phaseNum}`}
              className="flex items-center justify-between rounded-lg bg-white p-3 transition-colors hover:shadow-sm dark:bg-[#0F2B46]"
            >
              <div>
                <p className="text-sm font-medium text-[#0F2B46] dark:text-white">{projectName}</p>
                <p className="text-xs text-[#94A3B8]">
                  Phase {phaseNum} — {PHASE_NAMES[gate.phase_number] ?? `Fase ${phaseNum}`}
                </p>
              </div>
              <span className="rounded-lg bg-[#F59E0B] px-3 py-1.5 text-xs font-semibold text-white">
                Revisar
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
