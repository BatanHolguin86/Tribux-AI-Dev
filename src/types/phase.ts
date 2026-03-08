export type PhaseMeta = {
  number: number
  name: string
  description: string
  icon: string
}

export const PHASES_META: PhaseMeta[] = [
  { number: 0, name: 'Discovery & Ideation', description: 'Entender el problema, usuarios y contexto', icon: '🔍' },
  { number: 1, name: 'Requirements & Spec', description: 'Definir requisitos y specs KIRO', icon: '📋' },
  { number: 2, name: 'Architecture & Design', description: 'Disenar arquitectura y esquemas', icon: '🏗️' },
  { number: 3, name: 'Environment Setup', description: 'Configurar repositorio e infraestructura', icon: '⚙️' },
  { number: 4, name: 'Core Development', description: 'Implementar funcionalidades core', icon: '💻' },
  { number: 5, name: 'Testing & QA', description: 'Tests y aseguramiento de calidad', icon: '🧪' },
  { number: 6, name: 'Launch & Deployment', description: 'Deploy a produccion', icon: '🚀' },
  { number: 7, name: 'Iteration & Growth', description: 'Iterar con feedback y metricas', icon: '📈' },
]
