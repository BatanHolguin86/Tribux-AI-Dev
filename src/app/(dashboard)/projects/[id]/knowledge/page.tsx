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

  // Fetch counts per category
  const categories = ['documentos', 'decisiones', 'guias', 'artefactos', 'notas']
  const countResults = await Promise.all(
    categories.map((cat) =>
      supabase
        .from('knowledge_base_entries')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('category', cat)
    )
  )

  const categoryCounts: Record<string, number> = {}
  categories.forEach((cat, i) => {
    categoryCounts[cat] = countResults[i].count ?? 0
  })

  return (
    <KnowledgeLayout
      projectId={projectId}
      initialEntries={(entries ?? []) as KnowledgeBaseEntry[]}
      initialTotal={count ?? 0}
      categoryCounts={categoryCounts}
    />
  )
}
