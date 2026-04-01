import { createClient } from '@/lib/supabase/server'
import { InfrastructureDashboard } from '@/components/infrastructure/InfrastructureDashboard'
import { redirect } from 'next/navigation'

export default async function InfrastructurePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  return (
    <InfrastructureDashboard
      projectId={projectId}
      projectName={project.name}
    />
  )
}
