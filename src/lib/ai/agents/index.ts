import type { AgentType } from '@/types/agent'
import type { Plan } from '@/types/user'

export type AgentMeta = {
  id: AgentType
  name: string
  icon: string
  specialty: string
  description: string
  planRequired: Plan
}

export const AGENTS: AgentMeta[] = [
  {
    id: 'cto_virtual',
    name: 'CTO Virtual',
    icon: '🧠',
    specialty: 'Vision holistica, delegacion, metodologia IA DLC',
    description:
      'Tu punto de contacto principal. Conoce todo tu proyecto y te guia en cada decision.',
    planRequired: 'starter',
  },
  {
    id: 'product_architect',
    name: 'Product Architect',
    icon: '📐',
    specialty: 'Producto, priorizacion, scope, user stories',
    description:
      'Experto en producto: define alcance, prioriza features, escribe user stories y valida el product-market fit.',
    planRequired: 'builder',
  },
  {
    id: 'system_architect',
    name: 'System Architect',
    icon: '🏗️',
    specialty: 'Arquitectura, patrones, tecnologias, diagramas',
    description:
      'Disenador de sistemas: elige tecnologias, define patrones y crea diagramas de arquitectura.',
    planRequired: 'builder',
  },
  {
    id: 'ui_ux_designer',
    name: 'UI/UX Designer',
    icon: '🎨',
    specialty: 'Wireframes, mockups, guias de estilo',
    description:
      'Disenador de experiencia: wireframes, mockups, guias de estilo y flujos de usuario basados en tus specs.',
    planRequired: 'builder',
  },
  {
    id: 'lead_developer',
    name: 'Lead Developer',
    icon: '💻',
    specialty: 'Implementacion, codigo, debugging, best practices',
    description:
      'Desarrollador senior: escribe codigo, resuelve bugs, sugiere refactorings y aplica best practices.',
    planRequired: 'builder',
  },
  {
    id: 'db_admin',
    name: 'DB Admin',
    icon: '🗄️',
    specialty: 'Esquemas, queries, migraciones, RLS, performance',
    description:
      'Administrador de datos: disenoa esquemas, optimiza queries, configura RLS y crea migraciones.',
    planRequired: 'builder',
  },
  {
    id: 'qa_engineer',
    name: 'QA Engineer',
    icon: '🧪',
    specialty: 'Testing, test cases, QA strategy, regression',
    description:
      'Ingeniero de calidad: genera test cases, define estrategia de testing y checklists de QA.',
    planRequired: 'builder',
  },
  {
    id: 'devops_engineer',
    name: 'DevOps & Operations',
    icon: '🚀',
    specialty: 'Deploy, CI/CD, monitoring, infraestructura, operaciones',
    description:
      'Ingeniero de operaciones: configura CI/CD, deploy, monitoring, runbooks, planes de ejecucion y scripts de infraestructura.',
    planRequired: 'builder',
  },
]

const agentEntries = AGENTS.map((a) => [a.id, a] as [AgentType, AgentMeta])
// Operator is merged into DevOps — alias for backward compatibility
const devops = AGENTS.find((a) => a.id === 'devops_engineer')!
agentEntries.push(['operator', { ...devops, id: 'operator' as AgentType }])

export const AGENT_MAP: Record<AgentType, AgentMeta> = Object.fromEntries(agentEntries) as Record<AgentType, AgentMeta>

const PLAN_HIERARCHY: Record<Plan, number> = {
  starter: 0,
  builder: 1,
  agency: 2,
  enterprise: 3,
}

export function isAgentAccessible(agentPlan: Plan, userPlan: Plan): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[agentPlan]
}
