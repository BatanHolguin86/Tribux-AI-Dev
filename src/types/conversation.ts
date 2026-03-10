export type ConversationRole = 'user' | 'assistant' | 'system'

export type Message = {
  role: ConversationRole
  content: string
  created_at: string
}

export type SectionStatus = 'pending' | 'in_progress' | 'completed' | 'approved'

export type Phase00Section =
  | 'problem_statement'
  | 'personas'
  | 'value_proposition'
  | 'metrics'
  | 'competitive_analysis'

export type Phase02Section =
  | 'system_architecture'
  | 'database_design'
  | 'api_design'
  | 'architecture_decisions'

export type AgentConversation = {
  id: string
  project_id: string
  phase_number: number | null
  section: string | null
  agent_type: string
  messages: Message[]
  created_at: string
  updated_at: string
}
