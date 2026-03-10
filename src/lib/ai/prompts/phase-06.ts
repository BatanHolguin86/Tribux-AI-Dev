export type Phase06Section =
  | 'deploy_production'
  | 'monitoring'
  | 'documentation'
  | 'launch_checklist'

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

export const PHASE06_SECTIONS: Phase06Section[] = [
  'deploy_production',
  'monitoring',
  'documentation',
  'launch_checklist',
]

export const SECTION_LABELS: Record<Phase06Section, string> = {
  deploy_production: 'Deploy a Produccion',
  monitoring: 'Monitoring & Alertas',
  documentation: 'Documentacion Operacional',
  launch_checklist: 'Launch Checklist',
}

export const CATEGORY_CONFIGS: Record<Phase06Section, CategoryConfig> = {
  deploy_production: {
    title: 'Deploy a Produccion',
    description: 'Configurar y ejecutar el deploy del producto a produccion.',
    icon: '🚀',
    items: [
      {
        label: 'Configurar variables de entorno en produccion',
        description: 'Todas las env vars necesarias en Vercel/hosting provider.',
      },
      {
        label: 'Ejecutar migraciones en base de datos de produccion',
        description: 'Aplicar todas las migraciones pendientes en Supabase prod.',
      },
      {
        label: 'Configurar dominio y SSL',
        description: 'DNS apuntando al hosting, certificado SSL activo.',
      },
      {
        label: 'Deploy exitoso verificado',
        description: 'Build de produccion corriendo sin errores en la URL final.',
      },
    ],
  },
  monitoring: {
    title: 'Monitoring & Alertas',
    description: 'Configurar herramientas de monitoreo y sistema de alertas.',
    icon: '📡',
    items: [
      {
        label: 'Configurar error tracking (Sentry)',
        description: 'Captura automatica de errores en frontend y backend.',
      },
      {
        label: 'Configurar analytics (Vercel Analytics)',
        description: 'Metricas de uso, performance y Core Web Vitals.',
      },
      {
        label: 'Configurar alertas criticas',
        description: 'Notificaciones para errores 5xx, downtime y anomalias.',
      },
    ],
  },
  documentation: {
    title: 'Documentacion Operacional',
    description: 'Documentar procedimientos operacionales y runbooks.',
    icon: '📖',
    items: [
      {
        label: 'Runbook de deployment',
        description: 'Paso a paso para hacer deploy, rollback y hotfix.',
      },
      {
        label: 'Documentar arquitectura en produccion',
        description: 'Diagrama de servicios, conexiones y dependencias.',
      },
      {
        label: 'Guia de troubleshooting',
        description: 'Problemas comunes y como resolverlos rapidamente.',
      },
    ],
  },
  launch_checklist: {
    title: 'Launch Checklist',
    description: 'Verificacion final antes de abrir al publico.',
    icon: '✅',
    items: [
      {
        label: 'Lighthouse score > 90',
        description: 'Performance, Accessibility y Best Practices en verde.',
      },
      {
        label: 'RLS habilitado en todas las tablas',
        description: 'Row Level Security activo para proteger datos de usuarios.',
      },
      {
        label: 'Tests E2E pasando en produccion',
        description: 'Suite de tests ejecutada contra el entorno de produccion.',
      },
      {
        label: 'Backup y recovery verificado',
        description: 'Backup automatico configurado y proceso de recovery testeado.',
      },
    ],
  },
}
