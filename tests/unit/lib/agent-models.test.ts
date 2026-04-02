import { describe, it, expect } from 'vitest'
import {
  ADVANCED_AGENT_MODEL_ID,
  AGENT_MODEL_IDS,
  FALLBACK_AGENT_MODEL_ID,
  getModelIdForAgent,
  getModelIdStringForUsage,
  parseAgentTypeParam,
} from '@/lib/ai/agent-models'
import type { AgentType } from '@/types/agent'

const ALL_AGENT_TYPES: AgentType[] = [
  'cto_virtual',
  'product_architect',
  'system_architect',
  'ui_ux_designer',
  'lead_developer',
  'db_admin',
  'qa_engineer',
  'devops_engineer',
  'operator',
]

const ALLOWED_MODEL_IDS = new Set(['claude-opus-4-6'])

describe('agent-models regression', () => {
  it('maps every AgentType to a non-empty Anthropic model id', () => {
    for (const id of ALL_AGENT_TYPES) {
      const mid = getModelIdForAgent(id)
      expect(mid.length).toBeGreaterThan(0)
      expect(ALLOWED_MODEL_IDS.has(mid)).toBe(true)
    }
  })

  it('AGENT_MODEL_IDS has exactly nine keys matching AgentType union', () => {
    const keys = Object.keys(AGENT_MODEL_IDS).sort()
    expect(keys).toEqual([...ALL_AGENT_TYPES].sort())
  })

  it('uses Opus (most advanced) for every agent', () => {
    for (const id of ALL_AGENT_TYPES) {
      expect(AGENT_MODEL_IDS[id]).toBe(ADVANCED_AGENT_MODEL_ID)
    }
  })

  it('parseAgentTypeParam falls back to cto_virtual for unknown or empty', () => {
    expect(parseAgentTypeParam(undefined)).toBe('cto_virtual')
    expect(parseAgentTypeParam('')).toBe('cto_virtual')
    expect(parseAgentTypeParam('not_an_agent')).toBe('cto_virtual')
  })

  it('parseAgentTypeParam accepts valid agent ids', () => {
    expect(parseAgentTypeParam('qa_engineer')).toBe('qa_engineer')
    expect(parseAgentTypeParam('lead_developer')).toBe('lead_developer')
  })

  it('getModelIdStringForUsage returns same id as getModelIdForAgent when AI_PROVIDER is anthropic', () => {
    const prev = process.env.AI_PROVIDER
    process.env.AI_PROVIDER = 'anthropic'
    try {
      for (const id of ALL_AGENT_TYPES) {
        expect(getModelIdStringForUsage(id)).toBe(getModelIdForAgent(id))
      }
    } finally {
      process.env.AI_PROVIDER = prev
    }
  })

  it('fallback id matches advanced tier', () => {
    expect(FALLBACK_AGENT_MODEL_ID).toBe(ADVANCED_AGENT_MODEL_ID)
  })
})
