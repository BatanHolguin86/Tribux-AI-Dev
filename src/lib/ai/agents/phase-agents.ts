import type { AgentType } from '@/types/agent'
import type { Phase00Section, Phase02Section } from '@/types/conversation'
import type { KiroDocumentType } from '@/types/feature'

/**
 * Maps each phase section to the agents that participate.
 * The CTO always leads — listed first. Specialist agents assist.
 */

export const PHASE_00_AGENTS: Record<Phase00Section, AgentType[]> = {
  problem_statement: ['cto_virtual', 'product_architect'],
  personas: ['cto_virtual', 'product_architect', 'ui_ux_designer'],
  value_proposition: ['cto_virtual', 'product_architect'],
  metrics: ['cto_virtual', 'product_architect', 'qa_engineer'],
  competitive_analysis: ['cto_virtual', 'product_architect'],
}

export const PHASE_01_AGENTS: Record<KiroDocumentType, AgentType[]> = {
  requirements: ['cto_virtual', 'product_architect', 'qa_engineer'],
  design: ['cto_virtual', 'system_architect', 'db_admin', 'ui_ux_designer'],
  tasks: ['cto_virtual', 'lead_developer', 'devops_engineer'],
}

export const PHASE_02_AGENTS: Record<Phase02Section, AgentType[]> = {
  system_architecture: ['cto_virtual', 'system_architect', 'devops_engineer'],
  database_design: ['cto_virtual', 'db_admin', 'system_architect'],
  api_design: ['cto_virtual', 'lead_developer', 'system_architect'],
  architecture_decisions: ['cto_virtual', 'system_architect', 'product_architect'],
}
