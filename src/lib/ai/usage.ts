/**
 * AI usage tracking for financial control and backoffice.
 * Multi-provider pricing: Anthropic, OpenAI, Google.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Multi-provider pricing table (USD per million tokens — input / output)
// Update when providers change prices.
// ---------------------------------------------------------------------------
const MODEL_PRICING: Record<string, { inputPerMTok: number; outputPerMTok: number }> = {
  // Anthropic — Claude 4.x
  'claude-sonnet-4-6':        { inputPerMTok: 3,    outputPerMTok: 15   },
  'claude-opus-4-6':          { inputPerMTok: 15,   outputPerMTok: 75   },
  'claude-haiku-4-5':         { inputPerMTok: 0.80, outputPerMTok: 4    },
  'claude-haiku-4-5-20251001':{ inputPerMTok: 0.80, outputPerMTok: 4    },
  // Anthropic — Claude 3.x (legacy)
  'claude-3-5-sonnet-20241022': { inputPerMTok: 3,  outputPerMTok: 15   },
  'claude-3-5-haiku-20241022':  { inputPerMTok: 0.80, outputPerMTok: 4  },
  // OpenAI
  'gpt-4o':                   { inputPerMTok: 2.50, outputPerMTok: 10   },
  'gpt-4o-mini':              { inputPerMTok: 0.15, outputPerMTok: 0.60 },
  'gpt-4-turbo':              { inputPerMTok: 10,   outputPerMTok: 30   },
  'o3':                       { inputPerMTok: 10,   outputPerMTok: 40   },
  'o4-mini':                  { inputPerMTok: 1.10, outputPerMTok: 4.40 },
  // Google Gemini
  'gemini-1.5-pro':           { inputPerMTok: 1.25, outputPerMTok: 5    },
  'gemini-1.5-flash':         { inputPerMTok: 0.075,outputPerMTok: 0.30 },
  'gemini-2.0-flash':         { inputPerMTok: 0.10, outputPerMTok: 0.40 },
  'gemini-2.0-flash-lite':    { inputPerMTok: 0.075,outputPerMTok: 0.30 },
  'gemini-2.5-pro':           { inputPerMTok: 1.25, outputPerMTok: 10   },
}

/** Default fallback: Claude Sonnet pricing */
const DEFAULT_PRICING = { inputPerMTok: 3, outputPerMTok: 15 }

/**
 * Compute cost for a specific model. Falls back to Claude Sonnet if model unknown.
 */
export function computeCostForModel(
  model: string | null | undefined,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = (model && MODEL_PRICING[model]) ? MODEL_PRICING[model] : DEFAULT_PRICING
  const cost =
    (inputTokens / 1_000_000) * pricing.inputPerMTok +
    (outputTokens / 1_000_000) * pricing.outputPerMTok
  return Math.round(cost * 1_000_000) / 1_000_000
}

/**
 * Compute cost using default Claude Sonnet pricing.
 * @deprecated Use computeCostForModel() instead.
 */
export function computeCostFromTokens(inputTokens: number, outputTokens: number): number {
  return computeCostForModel(null, inputTokens, outputTokens)
}

// ---------------------------------------------------------------------------
// Event types — all AI-consuming operations in the app
// ---------------------------------------------------------------------------
export const AI_USAGE_EVENT_TYPES = [
  // Agents & chat
  'agent_chat',
  'thread_title',
  'suggestions',
  // Phase 00-02
  'phase00_chat',
  'phase00_generate',
  'phase01_chat',
  'phase01_generate',
  'phase01_autodraft',
  'phase01_autodraft_specialist',
  'phase02_chat',
  'phase02_generate',
  // Phase 03-07 chat
  'phase03_chat',
  'phase04_chat',
  'phase05_chat',
  'phase06_chat',
  'phase07_chat',
  // Sprint 6 — Phase 03 actions
  'action_scaffold_project',
  'action_apply_db_schema',
  'action_configure_auth',
  'action_generate_env_template',
  // Sprint 6 — Phase 04 actions
  'action_analyze_task',
  'action_generate_task_code',
  'action_auto_build_task',
  // Sprint 6 — Phase 05 actions
  'action_generate_test_plan',
  'action_generate_unit_tests',
  'action_generate_e2e_tests',
  'action_generate_qa_report',
  // Sprint 6 — Phase 06 actions
  'action_generate_ops_runbook',
  // Sprint 6 — Phase 07 actions
  'action_generate_analysis_report',
  'action_generate_backlog',
  'action_generate_retrospective',
  // Design
  'design_generate',
  'design_refine',
] as const

export type AiUsageEventType = (typeof AI_USAGE_EVENT_TYPES)[number]

// ---------------------------------------------------------------------------
// Recording helpers
// ---------------------------------------------------------------------------

export type RecordAiUsageParams = {
  userId: string
  projectId?: string | null
  eventType: AiUsageEventType
  model?: string | null
  inputTokens: number
  outputTokens: number
}

/**
 * Records an AI usage event with estimated cost.
 * Uses the provided Supabase client (must have insert access to ai_usage_events).
 */
export async function recordAiUsage(
  supabase: SupabaseClient,
  params: RecordAiUsageParams,
): Promise<void> {
  const { userId, projectId, eventType, model, inputTokens, outputTokens } = params
  const estimatedCostUsd = computeCostForModel(model, inputTokens, outputTokens)

  const { error } = await supabase.from('ai_usage_events').insert({
    user_id: userId,
    project_id: projectId ?? null,
    event_type: eventType,
    model: model ?? null,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost_usd: estimatedCostUsd,
  })

  if (error) {
    console.error(`[ai-usage] recordAiUsage failed (${eventType}):`, error.message, { userId, projectId, inputTokens, outputTokens })
  }
}

/**
 * Fire-and-forget usage recording for streamText onFinish callbacks.
 * Uses admin client so it works even after the user session expires.
 * Logs errors to console but never throws — usage tracking must never break the main flow.
 */
export async function recordStreamUsage(params: {
  userId: string
  projectId?: string | null
  eventType: AiUsageEventType
  model: string | null | undefined
  usage: { inputTokens?: number | undefined; outputTokens?: number | undefined }
}): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ai-usage] recordStreamUsage: SUPABASE_SERVICE_ROLE_KEY is not set — usage not recorded', { eventType: params.eventType })
    return
  }
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const admin = await createAdminClient()
    await recordAiUsage(admin, {
      userId: params.userId,
      projectId: params.projectId,
      eventType: params.eventType,
      model: params.model,
      inputTokens: params.usage.inputTokens ?? 0,
      outputTokens: params.usage.outputTokens ?? 0,
    })
  } catch (err) {
    console.error('[ai-usage] recordStreamUsage threw unexpectedly:', err instanceof Error ? err.message : err)
  }
}

/**
 * Rough token estimate from text length (~4 chars per token for English/code).
 * Use when the SDK does not return usage.
 */
export function estimateTokensFromText(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}
