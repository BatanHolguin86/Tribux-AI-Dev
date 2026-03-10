export type Phase05Section =
  | 'test_plan'
  | 'unit_tests'
  | 'integration_tests'
  | 'e2e_tests'
  | 'qa_report'

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

export const PHASE05_SECTIONS: Phase05Section[] = [
  'test_plan',
  'unit_tests',
  'integration_tests',
  'e2e_tests',
  'qa_report',
]

export const SECTION_LABELS: Record<Phase05Section, string> = {
  test_plan: 'Test Plan',
  unit_tests: 'Unit Tests',
  integration_tests: 'Integration Tests',
  e2e_tests: 'E2E Tests',
  qa_report: 'QA Report',
}

export const CATEGORY_CONFIGS: Record<Phase05Section, CategoryConfig> = {
  test_plan: {
    title: 'Test Plan',
    description: 'Define la estrategia de testing y los criterios de aceptacion.',
    icon: '📝',
    items: [
      {
        label: 'Definir criterios de aceptacion por feature',
        description: 'Basados en los acceptance criteria de los specs KIRO.',
      },
      {
        label: 'Identificar flujos criticos a testear',
        description: 'Los flujos que si fallan, el producto no funciona (happy path).',
      },
      {
        label: 'Definir cobertura minima objetivo',
        description: 'Porcentaje de cobertura de tests unitarios (ej: 70%).',
      },
    ],
  },
  unit_tests: {
    title: 'Unit Tests',
    description: 'Tests unitarios para logica de negocio, utilidades y validaciones.',
    icon: '🧪',
    items: [
      {
        label: 'Tests de validaciones (Zod schemas)',
        description: 'Verificar que las validaciones de input aceptan datos correctos y rechazan incorrectos.',
      },
      {
        label: 'Tests de logica de negocio',
        description: 'Tests para funciones puras y helpers de logica de negocio.',
      },
      {
        label: 'Tests de transformaciones de datos',
        description: 'Parsers, formatters, y funciones de transformacion.',
      },
      {
        label: 'Ejecutar tests y verificar que pasan',
        description: 'Correr la suite completa y verificar 0 fallos.',
      },
    ],
  },
  integration_tests: {
    title: 'Integration Tests',
    description: 'Tests que verifican la comunicacion entre componentes y servicios.',
    icon: '🔗',
    items: [
      {
        label: 'Tests de API endpoints',
        description: 'Verificar request/response de cada endpoint critico.',
      },
      {
        label: 'Tests de base de datos',
        description: 'Verificar queries, RLS policies y migraciones.',
      },
      {
        label: 'Tests de autenticacion',
        description: 'Verificar flujos de auth: login, registro, sesion, permisos.',
      },
    ],
  },
  e2e_tests: {
    title: 'End-to-End Tests',
    description: 'Tests que simulan el comportamiento real del usuario en el navegador.',
    icon: '🖥️',
    items: [
      {
        label: 'Test del flujo de registro/login',
        description: 'Usuario se registra, hace login y accede al dashboard.',
      },
      {
        label: 'Test del flujo principal del producto',
        description: 'El happy path mas importante del producto funciona end-to-end.',
      },
      {
        label: 'Test de edge cases criticos',
        description: 'Errores de red, inputs invalidos, estados vacios.',
      },
    ],
  },
  qa_report: {
    title: 'QA Report',
    description: 'Reporte final de calidad con resultados y recomendaciones.',
    icon: '📊',
    items: [
      {
        label: 'Documentar resultados de todos los tests',
        description: 'Total tests, pasados, fallidos, cobertura alcanzada.',
      },
      {
        label: 'Listar bugs encontrados y su severidad',
        description: 'Criticos, mayores, menores — con estado (arreglado/pendiente).',
      },
      {
        label: 'Performance audit (Lighthouse)',
        description: 'Ejecutar Lighthouse y documentar scores de Performance, A11y, Best Practices.',
      },
      {
        label: 'Aprobacion final de QA',
        description: 'Confirmar que el producto cumple los criterios minimos de calidad para launch.',
      },
    ],
  },
}
