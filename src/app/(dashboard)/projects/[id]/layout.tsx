import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PHASE_NAMES } from '@/types/project'
import type { PhaseStatus } from '@/types/project'
import { FloatingAgentButton } from '@/components/agents/FloatingAgentButton'
import { PhasesStepper } from '@/components/projects/PhasesStepper'
import { ProactiveSuggestions } from '@/components/projects/ProactiveSuggestions'
import { ProjectTools } from '@/components/projects/ProjectTools'

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
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/dashboard" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
          Proyectos
        </Link>
        <svg className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/projects/${id}/phase/${String(currentPhase).padStart(2, '0')}`} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
          {projectName}
        </Link>
        <svg className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Phase {String(currentPhase).padStart(2, '0')}: {phaseName}
        </span>
      </nav>

      {/* Main layout: sidebar + content */}
      <div className="flex gap-6">
        {/* Sidebar — sticky with scroll, hidden on mobile */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-5rem)] space-y-5 overflow-y-auto scrollbar-hide pb-6">
            <PhasesStepper projectId={id} phases={phases} />
            <ProjectTools projectId={id} />
            <ProactiveSuggestions projectId={id} phases={phases} currentPhase={currentPhase} />
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <FloatingAgentButton projectId={id} />
    </div>
  )
}
