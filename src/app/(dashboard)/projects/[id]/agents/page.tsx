import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Agents are now integrated into each phase's Equipo tab.
 * Redirect to the project's active phase.
 */
export default async function AgentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('current_phase')
    .eq('id', id)
    .single()

  const phase = String(project?.current_phase ?? 0).padStart(2, '0')
  redirect(`/projects/${id}/phase/${phase}`)
}
