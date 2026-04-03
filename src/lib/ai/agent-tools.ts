'server-only'

import { tool } from 'ai'
import { z } from 'zod'
import { fetchFileContent, fetchDirectoryListing, searchCode } from '@/lib/github/file-content'
import { commitMultipleFiles } from '@/lib/github/commit'
import { executeSqlOnProject, validateSqlSafety } from '@/lib/supabase/management-api'
import { getGitHubRepoContext } from '@/lib/github/repo-context'
import { triggerWorkflowDispatch, getLatestCIRun, getCIJobLogs } from '@/lib/github/workflows'
import { createAdminClient } from '@/lib/supabase/server'
import type { AgentType } from '@/types/agent'

export type AgentToolContext = {
  projectId: string
  repoUrl: string | null
  supabaseProjectRef: string | null
  supabaseAccessToken: string | null
  agentType: AgentType
}

// Agents that can write code to the repository
const CODE_WRITE_AGENTS: string[] = [
  'lead_developer',
  'qa_engineer',
  'devops_engineer',
  'ui_ux_designer',
  'db_admin',
  'operator',
  'cto_virtual',
]

// Agents that can execute SQL
const SQL_AGENTS: string[] = ['db_admin', 'cto_virtual', 'lead_developer']

function createReadTools(ctx: AgentToolContext) {
  return {
    read_file: tool({
      description:
        'Read the contents of a file from the project GitHub repository. Use this to understand existing code before modifying it.',
      inputSchema: z.object({
        path: z
          .string()
          .describe('The file path in the repository (e.g., src/app/page.tsx, package.json)'),
        branch: z.string().optional().describe('Branch name. Defaults to main.'),
      }),
      execute: async ({ path, branch = 'main' }) => {
        if (!ctx.repoUrl) return { error: 'No GitHub repository configured for this project' }
        try {
          const content = await fetchFileContent(ctx.repoUrl, path, branch)
          if (!content) return { error: `File not found: ${path}` }
          return { path, content: content.slice(0, 12000) }
        } catch (e) {
          return { error: `Could not read file: ${String(e)}` }
        }
      },
    }),

    list_files: tool({
      description:
        'List files in the project repository. Use to discover the project structure before reading or writing files.',
      inputSchema: z.object({
        directory: z
          .string()
          .optional()
          .describe(
            'Directory path to list (e.g., src/components). Leave empty for full repo tree.',
          ),
        branch: z.string().optional().describe('Branch name. Defaults to main.'),
      }),
      execute: async ({ directory, branch = 'main' }) => {
        if (!ctx.repoUrl) return { error: 'No GitHub repository configured' }
        try {
          if (directory) {
            const files = await fetchDirectoryListing(ctx.repoUrl, directory, branch)
            return { directory, files }
          }
          const repoCtx = await getGitHubRepoContext(ctx.repoUrl)
          return {
            tree: repoCtx?.tree?.slice(0, 4000) ?? 'Repository tree not available',
          }
        } catch (e) {
          return { error: `Could not list files: ${String(e)}` }
        }
      },
    }),

    read_spec: tool({
      description:
        'Read KIRO specs (requirements, design docs, or task lists) for project features. Use to understand what needs to be built before writing code.',
      inputSchema: z.object({
        feature_name: z
          .string()
          .optional()
          .describe(
            'Feature name to filter by. Leave empty to list all available specs.',
          ),
        doc_type: z
          .enum(['requirements', 'design', 'tasks'])
          .optional()
          .describe('Type of document: requirements, design, or tasks'),
      }),
      execute: async ({ feature_name, doc_type }) => {
        const supabase = await createAdminClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query: any = supabase
          .from('feature_documents')
          .select('feature_id, document_type, content, status, project_features(name)')
          .eq('project_id', ctx.projectId)
          .in('status', ['approved', 'draft'])

        if (doc_type) query = query.eq('document_type', doc_type)

        const { data } = await query.limit(10)
        if (!data?.length) return { message: 'No specs found for this project' }

        let filtered = data as Array<{
          feature_id: string
          document_type: string
          content?: string
          status: string
          project_features: { name: string } | null
        }>

        if (feature_name) {
          const search = feature_name.toLowerCase()
          filtered = filtered.filter((d) =>
            d.project_features?.name?.toLowerCase().includes(search),
          )
        }

        return {
          specs: filtered.slice(0, 5).map((d) => ({
            feature: d.project_features?.name ?? 'Unknown',
            type: d.document_type,
            status: d.status,
            content: d.content?.slice(0, 6000),
          })),
        }
      },
    }),

    read_design_artifact: tool({
      description:
        'Read approved design artifacts (wireframes, mockups) for this project. Returns HTML content that shows the intended UI design. Use before implementing frontend components to match the approved visual design.',
      inputSchema: z.object({
        screen_name: z
          .string()
          .optional()
          .describe('Screen name to filter by (e.g., "Dashboard", "Login"). Leave empty to list all.'),
      }),
      execute: async ({ screen_name }) => {
        const supabase = await createAdminClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query: any = supabase
          .from('design_artifacts')
          .select('screen_name, type, source, content, external_url, status')
          .eq('project_id', ctx.projectId)
          .eq('status', 'approved')

        if (screen_name) query = query.ilike('screen_name', `%${screen_name}%`)

        const { data } = await query.limit(5)
        if (!data?.length) return { message: 'No approved design artifacts found. Check Phase 02 Design Hub.' }
        return {
          designs: (
            data as Array<{
              screen_name: string
              type: string
              source: string
              content?: string
              external_url?: string
              status: string
            }>
          ).map((d) => ({
            screen: d.screen_name,
            type: d.type,
            source: d.source,
            external_url: d.external_url ?? null,
            html: d.content?.slice(0, 8000) ?? null,
          })),
        }
      },
    }),

    search_code: tool({
      description:
        'Search for code patterns, function names, or text across all files in the project repository. Use this to find where something is defined or used before reading specific files.',
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            'Search query (e.g., "useAuth", "POST /api/users", "createClient"). Supports GitHub code search syntax.',
          ),
      }),
      execute: async ({ query }) => {
        if (!ctx.repoUrl) return { error: 'No GitHub repository configured' }
        try {
          const results = await searchCode(ctx.repoUrl, query)
          if (!results.length) return { message: 'No results found', query }
          return {
            query,
            results: results.map((r) => ({
              path: r.path,
              snippet: r.snippet.slice(0, 300),
            })),
          }
        } catch (e) {
          return { error: `Search failed: ${String(e)}` }
        }
      },
    }),

    get_knowledge_base: tool({
      description:
        'Search the project knowledge base for relevant information, previous decisions, or documentation.',
      inputSchema: z.object({
        query: z
          .string()
          .describe('Search term or topic to look up in the knowledge base'),
      }),
      execute: async ({ query }) => {
        const supabase = await createAdminClient()
        const { data } = await supabase
          .from('knowledge_base_entries')
          .select('title, content, category')
          .eq('project_id', ctx.projectId)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(5)

        if (!data?.length) return { message: 'No matching knowledge base entries found' }
        return {
          entries: (
            data as Array<{ title: string; category?: string; content?: string }>
          ).map((e) => ({
            title: e.title,
            category: e.category,
            content: e.content?.slice(0, 3000),
          })),
        }
      },
    }),

    save_to_memory: tool({
      description:
        'Save important project knowledge to the knowledge base so future agent sessions remember it. Use for: architectural decisions, patterns discovered, bugs fixed and how, conventions specific to this project.',
      inputSchema: z.object({
        title: z.string().describe('Short descriptive title (e.g., "Auth pattern uses middleware")'),
        content: z
          .string()
          .describe('What was learned, decided, or discovered. Be specific and actionable.'),
        category: z
          .enum(['architecture', 'patterns', 'decisions', 'bugs_fixed', 'conventions', 'agent_memory'])
          .describe('Category for this memory entry'),
      }),
      execute: async ({ title, content, category }) => {
        const supabase = await createAdminClient()
        const { error } = await supabase.from('knowledge_base_entries').insert({
          project_id: ctx.projectId,
          title,
          content,
          category,
          summary: content.slice(0, 200),
          source_type: 'agent',
          source_id: null,
          is_pinned: false,
        })
        if (error) return { error: error.message }
        return { success: true, saved: title, category }
      },
    }),
  }
}

function createWriteTools(ctx: AgentToolContext) {
  return {
    edit_file: tool({
      description:
        'Edit specific sections of an existing file without rewriting it entirely. Preferred over write_files for bug fixes and small modifications — safer and uses fewer tokens.',
      inputSchema: z.object({
        path: z
          .string()
          .describe('File path relative to repo root (e.g., src/components/Button.tsx)'),
        edits: z
          .array(
            z.object({
              old_snippet: z
                .string()
                .describe(
                  'The exact text to find and replace. Must match the file content exactly including indentation.',
                ),
              new_snippet: z.string().describe('The replacement text'),
            }),
          )
          .describe('Ordered list of edits to apply'),
        commit_message: z
          .string()
          .describe('Commit message following conventional commits (e.g., fix: correct validation logic)'),
        branch: z.string().optional().describe('Target branch. Defaults to main.'),
      }),
      execute: async ({ path, edits, commit_message, branch = 'main' }) => {
        if (!ctx.repoUrl) return { error: 'No GitHub repository configured' }
        try {
          const original = await fetchFileContent(ctx.repoUrl, path, branch)
          if (!original) return { error: `File not found: ${path}` }

          let updated = original
          const applied: number[] = []
          const notFound: string[] = []

          for (let i = 0; i < edits.length; i++) {
            const { old_snippet, new_snippet } = edits[i]
            if (updated.includes(old_snippet)) {
              updated = updated.replace(old_snippet, new_snippet)
              applied.push(i)
            } else {
              notFound.push(`edit[${i}]: "${old_snippet.slice(0, 60)}…"`)
            }
          }

          if (notFound.length > 0 && applied.length === 0) {
            return {
              error: 'No snippets matched. Read the file first to get exact content.',
              not_found: notFound,
            }
          }

          const result = await commitMultipleFiles(
            ctx.repoUrl,
            [{ path, content: updated }],
            commit_message,
            branch,
          )

          return {
            success: true,
            path,
            edits_applied: applied.length,
            edits_skipped: notFound.length,
            skipped_details: notFound.length > 0 ? notFound : undefined,
            sha: result.sha,
            url: result.url,
          }
        } catch (e) {
          return { error: `Edit failed: ${String(e)}` }
        }
      },
    }),

    write_files: tool({
      description:
        'Commit one or more files to the project GitHub repository. Use this to create or update source code files. Always read existing files first before overwriting.',
      inputSchema: z.object({
        files: z
          .array(
            z.object({
              path: z
                .string()
                .describe(
                  'File path relative to repo root (e.g., src/components/Button.tsx)',
                ),
              content: z.string().describe('Complete file content to write'),
            }),
          )
          .describe('Files to create or update'),
        commit_message: z
          .string()
          .describe(
            'Descriptive commit message following conventional commits (e.g., feat: add Button component)',
          ),
        branch: z.string().optional().describe('Target branch. Defaults to main.'),
      }),
      execute: async ({ files, commit_message, branch = 'main' }) => {
        if (!ctx.repoUrl) return { error: 'No GitHub repository configured for this project' }
        try {
          const result = await commitMultipleFiles(ctx.repoUrl, files, commit_message, branch)
          return {
            success: true,
            sha: result.sha,
            url: result.url,
            filesChanged: result.filesChanged,
            files: files.map((f) => f.path),
          }
        } catch (e) {
          return { error: `Commit failed: ${String(e)}` }
        }
      },
    }),
  }
}

function createSqlTools(ctx: AgentToolContext) {
  return {
    execute_sql: tool({
      description:
        'Execute SQL on the project Supabase database. Use for creating tables, adding columns, creating indexes, RLS policies, or running queries.',
      inputSchema: z.object({
        sql: z.string().describe('SQL statement to execute'),
        confirm: z
          .boolean()
          .optional()
          .describe(
            'Set to true to confirm execution of SQL that modifies data or structure. Required for DROP, TRUNCATE, DELETE without WHERE.',
          ),
      }),
      execute: async ({ sql, confirm = false }) => {
        if (!ctx.supabaseProjectRef || !ctx.supabaseAccessToken) {
          return {
            error:
              'Supabase credentials not configured for this project. Ask the user to add their Supabase project ref and access token in project settings.',
          }
        }
        const safety = validateSqlSafety(sql)
        if (!safety.safe && !confirm) {
          return {
            warning: 'This SQL contains potentially destructive operations',
            reason: safety.reason,
            message:
              'Review the SQL carefully. If you are sure, call execute_sql again with confirm: true.',
          }
        }
        try {
          const result = await executeSqlOnProject(
            ctx.supabaseProjectRef,
            ctx.supabaseAccessToken,
            sql,
          )
          if (!result.success) return { error: result.error ?? 'SQL execution failed' }
          return { success: true, rowCount: result.rowCount }
        } catch (e) {
          return { error: `SQL execution failed: ${String(e)}` }
        }
      },
    }),
  }
}

// Agents that can use CI tools
const CI_AGENTS: string[] = ['lead_developer', 'qa_engineer', 'devops_engineer', 'cto_virtual']

function createCITools(ctx: AgentToolContext) {
  return {
    get_ci_status: tool({
      description:
        'Check the status of the latest CI run triggered by the last push to the repo. Call this after write_files to verify your code passes tests. If status is "in_progress", call again in a moment.',
      inputSchema: z.object({
        branch: z.string().optional().describe('Branch to check. Defaults to main.'),
      }),
      execute: async ({ branch = 'main' }) => {
        if (!ctx.repoUrl) return { error: 'No GitHub repository configured' }
        try {
          const run = await getLatestCIRun(ctx.repoUrl, branch)
          if (!run) {
            return {
              message: 'No CI runs found. The repo may not have GitHub Actions configured, or no push has been made yet.',
            }
          }
          return {
            run_id: run.id,
            workflow: run.workflowName,
            status: run.status,
            conclusion: run.conclusion ?? 'pending',
            url: run.html_url,
            updated_at: run.updated_at,
            passed: run.status === 'completed' && run.conclusion === 'success',
            failed: run.status === 'completed' && run.conclusion === 'failure',
            running: run.status === 'in_progress' || run.status === 'queued',
          }
        } catch (e) {
          return { error: `Could not get CI status: ${String(e)}` }
        }
      },
    }),

    get_ci_logs: tool({
      description:
        'Read the failure logs from a CI run to understand what went wrong. Call this when get_ci_status returns failed=true.',
      inputSchema: z.object({
        run_id: z.number().describe('The CI run ID from get_ci_status'),
      }),
      execute: async ({ run_id }) => {
        if (!ctx.repoUrl) return { error: 'No GitHub repository configured' }
        try {
          const logs = await getCIJobLogs(ctx.repoUrl, run_id)
          return { run_id, logs: logs.slice(0, 6000) }
        } catch (e) {
          return { error: `Could not fetch CI logs: ${String(e)}` }
        }
      },
    }),

    trigger_ci: tool({
      description:
        'Explicitly trigger a CI workflow. Use this when you want to run CI without making a new commit, or to run a specific workflow file.',
      inputSchema: z.object({
        workflow_file: z
          .string()
          .describe('Workflow filename (e.g., ci.yml, test.yml). Check .github/workflows/ for available files.'),
        branch: z.string().optional().describe('Branch to run on. Defaults to main.'),
      }),
      execute: async ({ workflow_file, branch = 'main' }) => {
        if (!ctx.repoUrl) return { error: 'No GitHub repository configured' }
        try {
          const result = await triggerWorkflowDispatch(ctx.repoUrl, workflow_file, branch)
          if (!result.success) return { error: result.error }
          return {
            success: true,
            message: `Triggered ${workflow_file} on ${branch}. Call get_ci_status in a few seconds to check progress.`,
          }
        } catch (e) {
          return { error: `Could not trigger CI: ${String(e)}` }
        }
      },
    }),
  }
}

/**
 * Creates the set of tools available to an agent based on their type and project context.
 * All agents get read tools. Write tools are granted based on agent role.
 */
export function createAgentTools(ctx: AgentToolContext) {
  const tools = { ...createReadTools(ctx) }

  if (ctx.repoUrl && CODE_WRITE_AGENTS.includes(ctx.agentType)) {
    Object.assign(tools, createWriteTools(ctx))
  }

  if (ctx.supabaseProjectRef && SQL_AGENTS.includes(ctx.agentType)) {
    Object.assign(tools, createSqlTools(ctx))
  }

  if (ctx.repoUrl && CI_AGENTS.includes(ctx.agentType)) {
    Object.assign(tools, createCITools(ctx))
  }

  return tools
}
