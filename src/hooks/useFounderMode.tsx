'use client'

import { createContext, useContext } from 'react'

type PersonaModeContextType = {
  isFounder: boolean
  isPM: boolean
  isConsultor: boolean
  persona: string | null
  /** Hide code, tool calls, CI logs — for founder + PM */
  hideCode: boolean
  /** Hide technical checklists — for founder only */
  hideChecklists: boolean
  /** Show full specs/architecture detail — for PM + consultor */
  showSpecs: boolean
}

const PersonaModeContext = createContext<PersonaModeContextType>({
  isFounder: false,
  isPM: false,
  isConsultor: false,
  persona: null,
  hideCode: false,
  hideChecklists: false,
  showSpecs: true,
})

/**
 * Persona Mode provider. Wraps the dashboard to provide persona-aware rendering.
 *
 * | Persona      | hideCode | hideChecklists | showSpecs | autoApproveArch |
 * |-------------|----------|----------------|-----------|-----------------|
 * | emprendedor | ✅       | ✅             | ❌        | ✅              |
 * | founder     | ❌       | ❌             | ✅        | ✅              |
 * | pm          | ❌       | ❌             | ✅        | ❌              |
 * | consultor   | ❌       | ❌             | ✅        | ❌              |
 *
 * Camila (emprendedor): vista simplificada, sin codigo ni checklists
 * Santiago (founder): ve todo (codigo, checklists, specs) pero con auto-approve
 * Valentina (pm): ve todo excepto auto-approve
 * Rodrigo (consultor): ve todo, control total
 */
export function FounderModeProvider({
  persona,
  children,
}: {
  persona: string | null
  children: React.ReactNode
}) {
  const isEmprendedor = persona === 'emprendedor'
  const isFounder = persona === 'founder' || persona === 'ceo' || isEmprendedor
  const isPM = persona === 'pm'
  const isConsultor = persona === 'consultor'

  const value: PersonaModeContextType = {
    isFounder,
    isPM,
    isConsultor,
    persona,
    // Solo Camila (emprendedor) tiene vista simplificada
    hideCode: isEmprendedor,
    hideChecklists: isEmprendedor,
    // Santiago, Valentina, Rodrigo ven specs. Camila no.
    showSpecs: !isEmprendedor,
  }

  return (
    <PersonaModeContext.Provider value={value}>
      {children}
    </PersonaModeContext.Provider>
  )
}

export function useFounderMode() {
  return useContext(PersonaModeContext)
}

/**
 * Labels map: technical term → founder-friendly Spanish
 */
export const FOUNDER_LABELS: Record<string, string> = {
  // Phase names
  'Requirements & Spec': 'Features de tu app',
  'KIRO Specs': 'Features de tu app',
  'Architecture & Design': 'Diseno de tu app',
  'Environment Setup': 'Preparar tu app',
  'Core Development': 'Construir tu app',
  'Testing & QA': 'Verificar que funciona',
  'Launch & Deployment': 'Publicar tu app',
  'Iteration & Growth': 'Mejorar tu app',

  // Section names
  'System Architecture': 'Estructura del sistema',
  'Database Design': 'Base de datos',
  'API Design': 'Conexiones',
  'Architecture Decisions': 'Decisiones tecnicas',

  // Document types
  'Requirements': 'Que hace',
  'Design': 'Como funciona',
  'Tasks': 'Pasos a seguir',

  // Build
  'CI (GitHub Actions)': 'Verificacion automatica',
  'GitHub Actions': 'Verificacion automatica',
  'Repositorio GitHub': 'Codigo de tu app',
  'Base de datos (Supabase)': 'Base de datos',
  'Deploy (Vercel)': 'Publicacion',
  'API Key (Anthropic)': 'Inteligencia artificial',

  // Status
  'review': 'Para revisar',
  'todo': 'Pendiente',
  'in_progress': 'En progreso',
  'done': 'Listo',

  // Phase header titles (additional)
  'Discovery & Ideation': 'Definir tu idea',
  'Define requisitos, diseno y tasks para cada feature': 'Define que hace cada feature',

  // Phase 03 sections
  'Repository': 'Codigo',
  'Database': 'Base de datos',
  'Authentication': 'Login y seguridad',
  'Hosting': 'Publicacion',
  'Environment Variables': 'Configuracion',
  'Verification': 'Verificacion',

  // Phase 05 sections
  'Test Plan': 'Plan de verificacion',
  'Unit Tests': 'Verificaciones basicas',
  'Integration Tests': 'Verificaciones de conexion',
  'E2E Tests': 'Verificaciones completas',
  'QA Report': 'Reporte de calidad',

  // Phase 06 sections
  'Deploy a Produccion': 'Publicar',
  'Monitoring & Alertas': 'Monitoreo',
  'Documentacion Operacional': 'Documentacion',
  'Launch Checklist': 'Lista de verificacion',

  // Phase 07 sections
  'Feedback de Usuarios': 'Opiniones de usuarios',
  'Metricas de Producto': 'Datos de uso',
  'Backlog Priorizado': 'Proximos pasos',
  'Retrospectiva': 'Que aprendimos',

  // Readiness
  'Fases previas (00-05)': 'Pasos anteriores',
  'Sentry (opcional)': 'Monitoreo de errores',
}

/**
 * Get a founder-friendly label, or return the original if not in founder mode.
 */
export function founderLabel(label: string, isFounder: boolean): string {
  if (!isFounder) return label
  return FOUNDER_LABELS[label] ?? label
}
