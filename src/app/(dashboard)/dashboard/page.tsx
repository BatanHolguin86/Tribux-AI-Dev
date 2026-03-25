import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getNextAction } from '@/lib/projects/get-next-action'
import { ProjectsGrid } from '@/components/dashboard/ProjectsGrid'
import type { ProjectWithProgress } from '@/types/project'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
      supabase_access_token: null, // Never send token to client
      has_supabase_token: !!p.supabase_access_token,
      current_phase: p.current_phase,
      status: p.status,
      last_activity: p.last_activity,
      created_at: p.created_at,
      updated_at: p.updated_at,
      active_phase: activePhase,
      phases_completed: phasesCompleted,
      progress_percentage: Math.round((phasesCompleted / 8) * 100),
      next_action: getNextAction(activePhase),
      phases: phases.sort((a: { phase_number: number }, b: { phase_number: number }) => a.phase_number - b.phase_number),
    }
  })

  return (
    <Suspense>
      <ProjectsGrid projects={enriched} />
    </Suspense>
  )
}
