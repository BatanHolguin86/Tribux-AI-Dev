/**
 * AI usage tracking for financial control and backoffice.
 * Costs based on Anthropic Claude Sonnet (see docs/00-discovery/06-plan-financiero-unit-economics.md).
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/** USD per million tokens — Claude Sonnet 4 (input / output) */
const USD_PER_MTOK_INPUT = 3
const USD_PER_MTOK_OUTPUT = 15

export const AI_USAGE_EVENT_TYPES = [
  'agent_chat',
  'phase00_chat',
  'phase00_generate',
  'phase01_chat',
  'phase01_generate',
  'phase02_chat',
  'phase02_generate',
  'phase03_chat',
  'phase04_chat',
  'phase05_chat',
  'phase06_chat',
  'phase07_chat',
  'design_generate',
  'design_refine',
  'thread_title',
  'suggestions',
] as const

export type AiUsageEventType = (typeof AI_USAGE_EVENT_TYPES)[number]

export function computeCostFromTokens(
  inputTokens: number,
  outputTokens: number,
): number {
  const inputCost = (inputTokens / 1_000_000) * USD_PER_MTOK_INPUT
  const outputCost = (outputTokens / 1_000_000) * USD_PER_MTOK_OUTPUT
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000
}

export type RecordAiUsageParams = {
  userId: string
  projectId?: string | null
  eventType: AiUsageEventType
  model?: string | null
  inputTokens: number
  outputTokens: number
}

/**
 * Records an AI usage event and estimated cost. Call from API routes after each IA call.
 * Uses the provided Supabase client (must be authenticated as userId for RLS insert).
 */
export async function recordAiUsage(
  supabase: SupabaseClient,
  params: RecordAiUsageParams,
): Promise<void> {
  const { userId, projectId, eventType, model, inputTokens, outputTokens } = params
  const estimatedCostUsd = computeCostFromTokens(inputTokens, outputTokens)

  await supabase.from('ai_usage_events').insert({
    user_id: userId,
    project_id: projectId ?? null,
    event_type: eventType,
    model: model ?? null,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost_usd: estimatedCostUsd,
  })
}

/**
 * Estimate token count from text length (rough: ~4 chars per token for English/code).
 * Use when the SDK does not return usage (e.g. streaming).
 */
export function estimateTokensFromText(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}
