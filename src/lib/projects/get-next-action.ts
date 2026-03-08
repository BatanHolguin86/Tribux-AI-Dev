import { PHASE_NAMES } from '@/types/project'

export function getNextAction(activePhase: number): string {
  const phaseName = PHASE_NAMES[activePhase] ?? 'Unknown'

  switch (activePhase) {
    case 0:
      return 'Completa el brief de Discovery'
    case 1:
      return 'Aprueba los specs KIRO'
    case 2:
      return 'Revisa la arquitectura del sistema'
    case 3:
      return 'Configura el entorno de desarrollo'
    case 4:
      return 'Supervisa el desarrollo de features'
    case 5:
      return 'Revisa los reportes de QA'
    case 6:
      return 'Aprueba el deploy a produccion'
    case 7:
      return 'Revisa metricas y feedback'
    default:
      return `Continua con ${phaseName}`
  }
}
