import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getNextAction } from '@/lib/projects/get-next-action'
import { ProjectsGrid } from '@/components/dashboard/ProjectsGrid'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { GlobalProgressBar } from '@/components/dashboard/GlobalProgressBar'
import { AgentActivityFeed } from '@/components/dashboard/AgentActivityFeed'
import { PendingGatesCard } from '@/components/dashboard/PendingGatesCard'
import type { ProjectWithProgress } from '@/types/project'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const displayName = profile?.full_name || user!.email?.split('@')[0] || 'Usuario'

  const { data: projects } = await supabase
    .from('projects')
    .select('*, project_phases(*)')
    .eq('user_id', user!.id)
    .order('last_activity', { ascending: false })

  const enriched: ProjectWithProgress[] = (projects ?? []).map((p) => {
    const phases = p.project_phases ?? []
    const phasesCompleted = phases.filter((ph: { status: string }) => ph.status === 'completed').length
    const activeRow = phases.find((ph: { status: string }) => ph.status === 'active')
    const activePhase = activeRow?.phase_number ?? p.current_phase

    return {
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      description: p.description,
      industry: p.industry,
      repo_url: p.repo_url ?? null,
      supabase_project_ref: p.supabase_project_ref ?? null,
      supabase_access_token: null,
      has_supabase_token: !!p.supabase_access_token,
      cycle_number: p.cycle_number ?? 1,
      current_phase: p.current_phase,
      status: p.status,
      last_activity: p.last_activity,
      created_at: p.created_at,
      updated_at: p.updated_at,
      active_phase: activePhase,
      phases_completed: phasesCompleted,
      progress_percentage: Math.round((phasesCompleted / 8) * 100),
      next_action: getNextAction(activePhase),
      phases: phases.sort(
        (a: { phase_number: number }, b: { phase_number: number }) => a.phase_number - b.phase_number,
      ),
    }
  })

  return (
    <div className="space-y-6">
      <DashboardGreeting displayName={displayName} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlobalProgressBar projects={enriched} />
        <Suspense
          fallback={
            <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          }
        >
          <PendingGatesCard />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        }
      >
        <AgentActivityFeed />
      </Suspense>

      <Suspense>
        <ProjectsGrid projects={enriched} />
      </Suspense>
    </div>
  )
}
