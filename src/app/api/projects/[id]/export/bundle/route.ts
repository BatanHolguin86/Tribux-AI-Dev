import { createClient } from '@/lib/supabase/server'
import { PHASE_NAMES } from '@/types/project'

/**
 * GET /api/projects/[id]/export/bundle
 * Downloads ALL project documentation as a single .md file with TOC.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return new Response('Not found', { status: 404 })
  }

  // Fetch all data in parallel
  const [projectDocsResult, featureDocsResult, knowledgeResult] = await Promise.all([
    supabase
      .from('project_documents')
      .select('id, title, section, phase_number, content')
      .eq('project_id', projectId)
      .order('phase_number')
      .order('section'),
    supabase
      .from('feature_documents')
      .select('id, doc_type, content, feature_id, project_features!inner(name, phase_number)')
      .eq('project_features.project_id', projectId)
      .order('created_at'),
    supabase
      .from('knowledge_base_entries')
      .select('id, title, category, content')
      .eq('project_id', projectId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false }),
  ])

  const projectDocs = projectDocsResult.data ?? []
  const featureDocs = featureDocsResult.data ?? []
  const knowledgeEntries = knowledgeResult.data ?? []

  const today = new Date().toISOString().split('T')[0]

  // Build TOC and body
  const tocLines: string[] = []
  const bodyParts: string[] = []

  // Group project docs by phase
  const docsByPhase = new Map<number, typeof projectDocs>()
  for (const doc of projectDocs) {
    const phase = doc.phase_number ?? 0
    if (!docsByPhase.has(phase)) docsByPhase.set(phase, [])
    docsByPhase.get(phase)!.push(doc)
  }

  for (const [phase, docs] of Array.from(docsByPhase.entries()).sort((a, b) => a[0] - b[0])) {
    const phaseName = PHASE_NAMES[phase] ?? `Phase ${String(phase).padStart(2, '0')}`
    const phaseLabel = `Phase ${String(phase).padStart(2, '0')}: ${phaseName}`
    tocLines.push(`- ${phaseLabel}`)
    bodyParts.push(`\n---\n\n## ${phaseLabel}\n`)

    for (const doc of docs) {
      const docTitle = doc.title ?? doc.section ?? 'Document'
      tocLines.push(`  - ${docTitle}`)
      bodyParts.push(`### ${docTitle}\n\n${doc.content ?? '*Sin contenido*'}\n`)
    }
  }

  // Feature documents
  if (featureDocs.length > 0) {
    tocLines.push('- Features')
    bodyParts.push('\n---\n\n## Features\n')

    for (const doc of featureDocs) {
      const featureInfo = doc.project_features as unknown as { name: string; phase_number: number }
      const featureName = featureInfo?.name ?? 'Feature'
      const title = `${featureName} — ${doc.doc_type}`
      tocLines.push(`  - ${title}`)
      bodyParts.push(`### ${title}\n\n${doc.content ?? '*Sin contenido*'}\n`)
    }
  }

  // Knowledge base entries
  if (knowledgeEntries.length > 0) {
    tocLines.push('- Base de Conocimiento')
    bodyParts.push('\n---\n\n## Base de Conocimiento\n')

    for (const entry of knowledgeEntries) {
      tocLines.push(`  - ${entry.title}`)
      bodyParts.push(`### ${entry.title}\n\n**Categoria:** ${entry.category}\n\n${entry.content ?? '*Sin contenido*'}\n`)
    }
  }

  // Assemble full markdown
  const markdown = [
    `# ${project.name} — Documentacion Completa`,
    `Generado: ${today}\n`,
    '## Tabla de Contenidos\n',
    tocLines.join('\n'),
    ...bodyParts,
  ].join('\n')

  const filename = `${slugify(project.name)}-docs.md`

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
