import { createClient } from '@/lib/supabase/server'
import { PHASE_NAMES } from '@/types/project'
import type { PhaseStatus } from '@/types/project'
import { FloatingAgentButton } from '@/components/agents/FloatingAgentButton'
import { PhasesStepper } from '@/components/projects/PhasesStepper'
import { ProactiveSuggestions } from '@/components/projects/ProactiveSuggestions'
import { MobileSidebarDrawer } from '@/components/projects/MobileSidebarDrawer'
import { ProjectBreadcrumb } from '@/components/projects/ProjectBreadcrumb'
import { DlcClosingNarrative } from '@/components/projects/DlcClosingNarrative'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('name, current_phase')
    .eq('id', id)
    .single()

  const { data: projectPhases } = await supabase
    .from('project_phases')
    .select('phase_number, status')
    .eq('project_id', id)
    .order('phase_number', { ascending: true })

  const projectName = project?.name ?? 'Proyecto'
  const currentPhase = project?.current_phase ?? 0
  const phaseName = PHASE_NAMES[currentPhase] ?? ''

  const phases = (projectPhases ?? []).map((p) => ({
    phase_number: p.phase_number as number,
    status: p.status as PhaseStatus,
  }))

  return (
    <div>
      <ProjectBreadcrumb
        projectId={id}
        projectName={projectName}
        currentPhase={currentPhase}
        phaseName={phaseName}
      />

      <DlcClosingNarrative variant="project" />

      {/* Main layout: sidebar + content */}
      <div className="flex gap-6">
        {/* Sidebar — sticky with scroll, hidden on mobile */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-5rem)] space-y-5 overflow-y-auto scrollbar-hide pb-6">
            <PhasesStepper projectId={id} phases={phases} />
            <ProactiveSuggestions projectId={id} phases={phases} currentPhase={currentPhase} />
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <FloatingAgentButton projectId={id} />
      <MobileSidebarDrawer projectId={id} phases={phases} currentPhase={currentPhase} />
    </div>
  )
}
