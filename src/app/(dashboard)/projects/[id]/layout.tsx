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
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-violet-600">
          Proyectos
        </Link>
        <span>/</span>
        <Link href={`/projects/${id}/phase/${String(currentPhase).padStart(2, '0')}`} className="hover:text-violet-600">
          {projectName}
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">
          Phase {String(currentPhase).padStart(2, '0')}: {phaseName}
        </span>
      </nav>

      {/* Main layout: sidebar + content */}
      <div className="flex gap-6">
        {/* Sidebar — hidden on mobile */}
        <aside className="hidden w-64 shrink-0 space-y-4 lg:block">
          <PhasesStepper projectId={id} phases={phases} />
          <ProjectTools projectId={id} />
          <ProactiveSuggestions projectId={id} phases={phases} currentPhase={currentPhase} />
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
