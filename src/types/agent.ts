import type { Plan } from './user'

export type AgentType =
  | 'cto_virtual'
  | 'product_architect'
  | 'system_architect'
  | 'ui_ux_designer'
  | 'lead_developer'
  | 'db_admin'
  | 'qa_engineer'
  | 'devops_engineer'

export type AgentDefinition = {
  id: AgentType
  name: string
  icon: string
  specialty: string
  description: string
  planRequired: Plan
  systemPrompt: string
}

export type ConversationThread = {
  id: string
  project_id: string
  agent_type: AgentType
  title: string | null
  messages: ThreadMessage[]
  message_count: number
  last_message_at: string
  created_at: string
  updated_at: string
}

export type ThreadMessage = {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
