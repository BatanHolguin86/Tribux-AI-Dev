/**
 * Per-agent LLM selection (Anthropic). All specialist agents use the most capable tier (Opus).
 * Non-Anthropic providers fall back to getDefaultModel() until per-provider maps exist.
 *
 * @see docs/02-architecture/decisions/ADR-006-provider-abstraction.md
 */

import { anthropic } from '@ai-sdk/anthropic'
import type { LanguageModel } from 'ai'
import type { AgentType } from '@/types/agent'
import { getDefaultModel, getDefaultModelId } from './models'

/** Claude Sonnet — best balance of quality/cost. Switch to Opus when budget allows. */
export const ADVANCED_AGENT_MODEL_ID = 'claude-sonnet-4-6'

/** Default when an unknown agent slips through (should not happen if AgentType is exhaustive). */
export const FALLBACK_AGENT_MODEL_ID = ADVANCED_AGENT_MODEL_ID

function getProvider(): string {
  return (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase()
}

/**
 * Anthropic model id per agent — all roles use Opus for maximum quality (cost ↑).
 */
export const AGENT_MODEL_IDS: Record<AgentType, string> = {
  cto_virtual: ADVANCED_AGENT_MODEL_ID,
  product_architect: ADVANCED_AGENT_MODEL_ID,
  system_architect: ADVANCED_AGENT_MODEL_ID,
  ui_ux_designer: ADVANCED_AGENT_MODEL_ID,
  lead_developer: ADVANCED_AGENT_MODEL_ID,
  db_admin: ADVANCED_AGENT_MODEL_ID,
  qa_engineer: ADVANCED_AGENT_MODEL_ID,
  devops_engineer: ADVANCED_AGENT_MODEL_ID,
  operator: ADVANCED_AGENT_MODEL_ID,
}

export function getModelIdForAgent(agentType: AgentType): string {
  return AGENT_MODEL_IDS[agentType] ?? FALLBACK_AGENT_MODEL_ID
}

/**
 * Resolves the LanguageModel for an agent. Uses Anthropic multi-tier map when AI_PROVIDER=anthropic.
 */
export function getModelForAgent(agentType: AgentType): LanguageModel {
  if (getProvider() !== 'anthropic') {
    return getDefaultModel()
  }
  return anthropic(getModelIdForAgent(agentType))
}

/** String id for usage / billing (matches MODEL_PRICING keys in usage.ts). */
export function getModelIdStringForUsage(agentType: AgentType): string {
  if (getProvider() !== 'anthropic') {
    return getDefaultModelId()
  }
  return getModelIdForAgent(agentType)
}

/** Resolves `agent_type` query param to a valid AgentType (default: CTO for generic suggestions). */
export function parseAgentTypeParam(raw: string | null | undefined): AgentType {
  if (raw && raw in AGENT_MODEL_IDS) return raw as AgentType
  return 'cto_virtual'
}
