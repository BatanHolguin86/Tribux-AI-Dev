import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PHASE_NAMES } from '@/types/project'

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

  const projectName = project?.name ?? 'Proyecto'
  const currentPhase = project?.current_phase ?? 0
  const phaseName = PHASE_NAMES[currentPhase] ?? ''

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

      {children}
    </div>
  )
}
