import { createAdminClient } from '@/lib/supabase/server'
import type { ActionExecutionStatus } from '@/types/action'

/**
 * Records an action execution start in the database.
 */
export async function recordActionStart(
  projectId: string,
  phaseNumber: number,
  section: string,
  itemIndex: number,
  actionName: string,
): Promise<string> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('action_executions')
    .insert({
      project_id: projectId,
      phase_number: phaseNumber,
      section,
      item_index: itemIndex,
      action_name: actionName,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[Action] Failed to record start:', error)
    return ''
  }

  return data.id
}

/**
 * Records an action execution completion.
 */
export async function recordActionComplete(
  executionId: string,
  status: ActionExecutionStatus,
  resultSummary?: string,
  resultData?: Record<string, unknown>,
  errorMessage?: string,
): Promise<void> {
  if (!executionId) return

  const supabase = await createAdminClient()

  await supabase
    .from('action_executions')
    .update({
      status,
      result_summary: resultSummary ?? null,
      result_data: resultData ?? null,
      error_message: errorMessage ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', executionId)
}

/**
 * Gets execution history for a project phase.
 */
export async function getPhaseExecutions(
  projectId: string,
  phaseNumber: number,
) {
  const supabase = await createAdminClient()

  const { data } = await supabase
    .from('action_executions')
    .select('*')
    .eq('project_id', projectId)
    .eq('phase_number', phaseNumber)
    .order('created_at', { ascending: false })
    .limit(50)

  return data ?? []
}
