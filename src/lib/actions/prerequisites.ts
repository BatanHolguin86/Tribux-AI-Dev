import type { PrerequisiteCheck } from '@/types/action'
import { createClient } from '@/lib/supabase/server'

type PrerequisiteResult = {
  met: boolean
  missing: string[]
}

export async function checkPrerequisites(
  projectId: string,
  prerequisites: PrerequisiteCheck[],
): Promise<PrerequisiteResult> {
  if (prerequisites.length === 0) return { met: true, missing: [] }

  const supabase = await createClient()
  const missing: string[] = []

  const { data: project } = await supabase
    .from('projects')
    .select('repo_url, supabase_project_ref, supabase_access_token')
    .eq('id', projectId)
    .single()

  if (!project) return { met: false, missing: ['Proyecto no encontrado'] }

  for (const prereq of prerequisites) {
    switch (prereq.type) {
      case 'field-exists': {
        const value = project[prereq.field]
        if (!value) {
          const labels: Record<string, string> = {
            repo_url: 'URL del repositorio GitHub',
            supabase_project_ref: 'Referencia del proyecto Supabase',
            supabase_access_token: 'Access token de Supabase',
          }
          missing.push(`Falta: ${labels[prereq.field] ?? prereq.field}. Configuralo en las integraciones del proyecto.`)
        }
        break
      }

      case 'env-exists': {
        if (!process.env[prereq.env]) {
          missing.push(`Variable de entorno ${prereq.env} no configurada en el servidor.`)
        }
        break
      }

      case 'phase-completed': {
        const { data: phases } = await supabase
          .from('project_phases')
          .select('status')
          .eq('project_id', projectId)
          .eq('phase_number', prereq.phase)
          .single()

        if (!phases || phases.status !== 'completed') {
          missing.push(`Phase ${String(prereq.phase).padStart(2, '0')} debe estar completada.`)
        }
        break
      }
    }
  }

  return { met: missing.length === 0, missing }
}
