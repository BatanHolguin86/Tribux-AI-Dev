export type Phase07Section =
  | 'feedback'
  | 'metrics'
  | 'backlog'
  | 'retrospective'

type ChecklistItem = {
  label: string
  description: string
}

type CategoryConfig = {
  title: string
  description: string
  icon: string
  items: ChecklistItem[]
}

export const PHASE07_SECTIONS: Phase07Section[] = [
  'feedback',
  'metrics',
  'backlog',
  'retrospective',
]

export const SECTION_LABELS: Record<Phase07Section, string> = {
  feedback: 'Feedback de Usuarios',
  metrics: 'Metricas de Producto',
  backlog: 'Backlog Priorizado',
  retrospective: 'Retrospectiva',
}

export const CATEGORY_CONFIGS: Record<Phase07Section, CategoryConfig> = {
  feedback: {
    title: 'Feedback de Usuarios',
    description: 'Recopilar y analizar feedback de los primeros usuarios.',
    icon: '💬',
    items: [
      {
        label: 'Configurar canal de feedback',
        description: 'Formulario in-app, email, o herramienta para recibir feedback.',
      },
      {
        label: 'Recopilar feedback de primeros usuarios',
        description: 'Al menos 5 sesiones de feedback con usuarios reales.',
      },
      {
        label: 'Clasificar feedback por tema y prioridad',
        description: 'Agrupar por: bugs, UX issues, feature requests, elogios.',
      },
    ],
  },
  metrics: {
    title: 'Metricas de Producto',
    description: 'Analizar las metricas clave del producto post-launch.',
    icon: '📊',
    items: [
      {
        label: 'Revisar metricas de uso (DAU, MAU, retention)',
        description: 'Cuantos usuarios activos y con que frecuencia regresan.',
      },
      {
        label: 'Analizar funnel de conversion',
        description: 'Donde se pierden usuarios: signup → onboarding → activacion.',
      },
      {
        label: 'Evaluar performance en produccion',
        description: 'Tiempos de carga, errores recurrentes, Core Web Vitals.',
      },
    ],
  },
  backlog: {
    title: 'Backlog Priorizado',
    description: 'Priorizar el trabajo para el siguiente ciclo de desarrollo.',
    icon: '📋',
    items: [
      {
        label: 'Crear backlog con items del feedback',
        description: 'Convertir feedback y bugs en items accionables.',
      },
      {
        label: 'Priorizar con framework ICE o RICE',
        description: 'Impact, Confidence, Ease — ordenar por valor/esfuerzo.',
      },
      {
        label: 'Definir scope del siguiente sprint',
        description: 'Seleccionar los items de mayor impacto para el proximo ciclo.',
      },
    ],
  },
  retrospective: {
    title: 'Retrospectiva',
    description: 'Reflexionar sobre el proceso y mejorar para el siguiente ciclo.',
    icon: '🔄',
    items: [
      {
        label: 'Que salio bien en este ciclo',
        description: 'Documentar exitos, buenas practicas y wins del equipo.',
      },
      {
        label: 'Que se puede mejorar',
        description: 'Identificar cuellos de botella, errores repetidos, deuda tecnica.',
      },
      {
        label: 'Action items para el siguiente ciclo',
        description: 'Mejoras concretas a implementar en el proximo IA DLC.',
      },
      {
        label: 'Actualizar CLAUDE.md si es necesario',
        description: 'Incorporar aprendizajes al documento de configuracion del orquestador.',
      },
    ],
  },
}
