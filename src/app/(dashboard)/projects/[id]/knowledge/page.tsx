import { createClient } from '@/lib/supabase/server'
import { KnowledgeLayout } from '@/components/knowledge/KnowledgeLayout'
import type { KnowledgeBaseEntry } from '@/types/knowledge'

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // Fetch first page of entries
  const { data: entries, count } = await supabase
    .from('knowledge_base_entries')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(0, 19)

  // Fetch counts per category + per phase in parallel
  const categories = ['documentos', 'decisiones', 'guias', 'artefactos', 'notas']
  const phases = [0, 1, 2, 3, 4, 5, 6, 7]

  const [catResults, phaseResults] = await Promise.all([
    Promise.all(
      categories.map((cat) =>
        supabase
          .from('knowledge_base_entries')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('category', cat)
      )
    ),
    Promise.all(
      phases.map((p) =>
        supabase
          .from('knowledge_base_entries')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('phase_number', p)
      )
    ),
  ])

  const categoryCounts: Record<string, number> = {}
  categories.forEach((cat, i) => {
    categoryCounts[cat] = catResults[i].count ?? 0
  })

  const phaseCounts: Record<number, number> = {}
  phases.forEach((p, i) => {
    phaseCounts[p] = phaseResults[i].count ?? 0
  })

  return (
    <KnowledgeLayout
      projectId={projectId}
      initialEntries={(entries ?? []) as KnowledgeBaseEntry[]}
      initialTotal={count ?? 0}
      categoryCounts={categoryCounts}
      phaseCounts={phaseCounts}
    />
  )
}
