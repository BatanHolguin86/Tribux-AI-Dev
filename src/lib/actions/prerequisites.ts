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
            repo_url: 'Tu proyecto necesita un repositorio de codigo. Ve a Infraestructura para configurarlo.',
            supabase_project_ref: 'Tu proyecto necesita una base de datos. Ve a Infraestructura para configurarla.',
            supabase_access_token: 'Falta conectar la base de datos. Ve a Infraestructura para completar la configuracion.',
          }
          missing.push(labels[prereq.field] ?? `Falta configurar: ${prereq.field}`)
        }
        break
      }

      case 'env-exists': {
        if (!process.env[prereq.env]) {
          const envLabels: Record<string, string> = {
            GITHUB_TOKEN: 'El repositorio de codigo no esta conectado. Contacta al administrador.',
            ANTHROPIC_API_KEY: 'El servicio de inteligencia artificial no esta disponible. Contacta al administrador.',
            PLATFORM_GITHUB_TOKEN: 'La plataforma no esta configurada. El administrador debe completar la configuracion.',
            PLATFORM_SUPABASE_TOKEN: 'La plataforma no esta configurada. El administrador debe completar la configuracion.',
            PLATFORM_VERCEL_TOKEN: 'La plataforma no esta configurada. El administrador debe completar la configuracion.',
          }
          missing.push(envLabels[prereq.env] ?? 'Falta una configuracion del servidor. Contacta al administrador.')
        }
        break
      }

      case 'phase-completed': {
        const phaseNames: Record<number, string> = {
          0: 'Discovery (definir tu idea)',
          1: 'Specs (especificar features)',
          2: 'Arquitectura (disenar el sistema)',
          3: 'Infraestructura (configurar el entorno)',
          4: 'Desarrollo (construir la app)',
          5: 'Testing (verificar calidad)',
        }
        const { data: phases } = await supabase
          .from('project_phases')
          .select('status')
          .eq('project_id', projectId)
          .eq('phase_number', prereq.phase)
          .single()

        if (!phases || phases.status !== 'completed') {
          missing.push(`Primero completa: ${phaseNames[prereq.phase] ?? `Fase ${prereq.phase}`}`)
        }
        break
      }
    }
  }

  return { met: missing.length === 0, missing }
}
