import JSZip from 'jszip'
import { createAdminClient } from '@/lib/supabase/server'
import { generateReadme } from './templates/readme-template'
import { generateTransferGuide } from './templates/transfer-template'
import { generateEnvTemplate } from './templates/env-template'

type ProjectData = {
  name: string
  description: string | null
  repo_url: string | null
  supabase_project_ref: string | null
  supabase_access_token: string | null
  supabase_api_url: string | null
  vercel_project_url: string | null
}

export async function buildTransferBundle(
  projectId: string,
): Promise<{ zip: JSZip; projectName: string }> {
  const supabase = await createAdminClient()
  const zip = new JSZip()

  // Fetch project data
  const { data: project } = await supabase
    .from('projects')
    .select('name, description, repo_url, supabase_project_ref, supabase_access_token, supabase_api_url, vercel_project_url')
    .eq('id', projectId)
    .single()

  if (!project) throw new Error('Proyecto no encontrado')
  const p = project as ProjectData

  // ── 1. Docs ─────────────────────────────────────────────────────────────
  const { data: docs } = await supabase
    .from('project_documents')
    .select('phase_number, section, document_type, content')
    .eq('project_id', projectId)
    .order('phase_number')

  for (const doc of docs ?? []) {
    if (!doc.content) continue
    const phase = String(doc.phase_number ?? 0).padStart(2, '0')
    const name = doc.section ?? doc.document_type
    zip.file(`docs/phase-${phase}/${name}.md`, doc.content)
  }

  // Feature docs
  const { data: features } = await supabase
    .from('project_features')
    .select('id, name')
    .eq('project_id', projectId)

  for (const feature of features ?? []) {
    const { data: featureDocs } = await supabase
      .from('feature_documents')
      .select('document_type, content')
      .eq('feature_id', feature.id)

    for (const fd of featureDocs ?? []) {
      if (!fd.content) continue
      const slug = feature.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      zip.file(`docs/features/${slug}/${fd.document_type}.md`, fd.content)
    }
  }

  // Knowledge base
  const { data: kbEntries } = await supabase
    .from('knowledge_base_entries')
    .select('title, content, category')
    .eq('project_id', projectId)

  for (const entry of kbEntries ?? []) {
    if (!entry.content) continue
    const slug = entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
    zip.file(`docs/knowledge-base/${slug}.md`, `# ${entry.title}\n\n**Category:** ${entry.category}\n\n${entry.content}`)
  }

  // ── 2. Designs ──────────────────────────────────────────────────────────
  const { data: designs } = await supabase
    .from('design_artifacts')
    .select('screen_name, content, source, external_url, type')
    .eq('project_id', projectId)

  const externalLinks: string[] = []

  for (const design of designs ?? []) {
    const slug = design.screen_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (design.content) {
      zip.file(`designs/${slug}.html`, design.content)
    }
    if (design.external_url) {
      externalLinks.push(`- **${design.screen_name}** (${design.source}): ${design.external_url}`)
    }
  }

  if (externalLinks.length > 0) {
    zip.file('designs/external-links.md', `# Enlaces a disenos externos\n\n${externalLinks.join('\n')}`)
  }

  // ── 3. Database schema ──────────────────────────────────────────────────
  if (p.supabase_project_ref && p.supabase_access_token) {
    try {
      const { executeSqlOnProject } = await import('@/lib/supabase/management-api')
      const schemaResult = await executeSqlOnProject(
        p.supabase_project_ref,
        p.supabase_access_token,
        `SELECT table_name, column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = 'public'
         ORDER BY table_name, ordinal_position`,
      )

      if (schemaResult) {
        // Generate SQL-like reference
        const rows = schemaResult as unknown as Array<{
          table_name: string
          column_name: string
          data_type: string
          is_nullable: string
          column_default: string | null
        }>

        let currentTable = ''
        let sql = '-- Database Schema (auto-exported)\n\n'

        for (const row of rows) {
          if (row.table_name !== currentTable) {
            if (currentTable) sql += ');\n\n'
            currentTable = row.table_name
            sql += `CREATE TABLE ${row.table_name} (\n`
          } else {
            sql += ',\n'
          }
          const nullable = row.is_nullable === 'YES' ? '' : ' NOT NULL'
          const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : ''
          sql += `  ${row.column_name} ${row.data_type}${nullable}${defaultVal}`
        }
        if (currentTable) sql += '\n);\n'

        zip.file('database/schema.sql', sql)
        zip.file('database/schema-reference.md', `# Schema Reference\n\nExportado desde Supabase project \`${p.supabase_project_ref}\`.\n\nVer \`schema.sql\` para el schema completo.`)
      }
    } catch {
      zip.file('database/README.md', '# Base de datos\n\nNo se pudo exportar el schema automaticamente. Contacta al administrador del proyecto.')
    }
  } else {
    zip.file('database/README.md', '# Base de datos\n\nNo hay Supabase configurado para este proyecto.')
  }

  // ── 4. Code reference ───────────────────────────────────────────────────
  if (p.repo_url) {
    zip.file('code/CLONE.md', `# Codigo Fuente\n\n\`\`\`bash\ngit clone ${p.repo_url}\n\`\`\`\n\nEl codigo vive en el repositorio GitHub. Este bundle incluye documentacion y schema, no el codigo fuente.`)
  } else {
    zip.file('code/README.md', '# Codigo\n\nNo hay repositorio configurado para este proyecto.')
  }

  // ── 5. Root files ───────────────────────────────────────────────────────
  zip.file('README.md', generateReadme({
    name: p.name,
    description: p.description,
    repoUrl: p.repo_url,
    supabaseRef: p.supabase_project_ref,
    vercelUrl: p.vercel_project_url,
  }))

  zip.file('TRANSFER.md', generateTransferGuide({
    name: p.name,
    repoUrl: p.repo_url,
    supabaseRef: p.supabase_project_ref,
    vercelUrl: p.vercel_project_url,
  }))

  zip.file('.env.example', generateEnvTemplate({
    supabaseRef: p.supabase_project_ref,
    supabaseApiUrl: p.supabase_api_url,
  }))

  return { zip, projectName: p.name }
}
