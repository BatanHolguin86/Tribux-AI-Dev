import { createClient } from '@/lib/supabase/server'
import { Phase04Layout } from '@/components/phase-04/Phase04Layout'
import type { TaskWithFeature } from '@/types/task'

export default async function Phase04Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // Fetch tasks with feature names
  const { data: tasks } = await supabase
    .from('project_tasks')
    .select('*, project_features(name)')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true })

  const tasksWithFeatures: TaskWithFeature[] = (tasks ?? []).map((t) => ({
    id: t.id,
    project_id: t.project_id,
    feature_id: t.feature_id,
    task_key: t.task_key,
    title: t.title,
    category: t.category,
    status: t.status,
    display_order: t.display_order,
    created_at: t.created_at,
    updated_at: t.updated_at,
    feature_name: (t.project_features as unknown as { name: string })?.name ?? null,
  }))

  return <Phase04Layout projectId={projectId} initialTasks={tasksWithFeatures} />
}
