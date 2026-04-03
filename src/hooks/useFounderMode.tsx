'use client'

import { createContext, useContext } from 'react'

type FounderModeContextType = {
  isFounder: boolean
  persona: string | null
}

const FounderModeContext = createContext<FounderModeContextType>({
  isFounder: false,
  persona: null,
})

/**
 * Founder Mode provider. Wraps the dashboard to provide persona-aware
 * rendering. "founder" and "emprendedor" personas get simplified UI:
 * - Technical terms replaced with simple Spanish
 * - Code/tool calls hidden in build sessions
 * - Architecture phases auto-simplified
 * - Checklists hidden when one-click setup completes
 */
export function FounderModeProvider({
  persona,
  children,
}: {
  persona: string | null
  children: React.ReactNode
}) {
  const isFounder = persona === 'founder' || persona === 'emprendedor'

  return (
    <FounderModeContext.Provider value={{ isFounder, persona }}>
      {children}
    </FounderModeContext.Provider>
  )
}

export function useFounderMode() {
  return useContext(FounderModeContext)
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
}

/**
 * Get a founder-friendly label, or return the original if not in founder mode.
 */
export function founderLabel(label: string, isFounder: boolean): string {
  if (!isFounder) return label
  return FOUNDER_LABELS[label] ?? label
}
