export type PhaseMeta = {
  number: number
  name: string
  description: string
  icon: string
}

export const PHASES_META: PhaseMeta[] = [
  { number: 0, name: 'Discovery', description: 'Entender el problema, usuarios y contexto', icon: '🔍' },
  { number: 1, name: 'Specs KIRO', description: 'Definir requisitos y specs KIRO', icon: '📋' },
  { number: 2, name: 'Arquitectura', description: 'Disenar arquitectura y esquemas', icon: '🏗️' },
  { number: 3, name: 'Infraestructura', description: 'Configurar repositorio e infraestructura', icon: '⚙️' },
  { number: 4, name: 'Desarrollo', description: 'Implementar funcionalidades core', icon: '💻' },
  { number: 5, name: 'Testing', description: 'Tests y aseguramiento de calidad', icon: '🧪' },
  { number: 6, name: 'Lanzamiento', description: 'Deploy a produccion', icon: '🚀' },
  { number: 7, name: 'Iteracion', description: 'Iterar con feedback y metricas', icon: '📈' },
]
