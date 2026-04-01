/**
 * GitHub Actions workflow integration.
 * Trigger workflows and poll for completion status.
 */

import { parseGitHubUrl } from './repo-context'

const GITHUB_API = 'https://api.github.com'

function getHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN is required for workflow operations')
  return {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'AI-Squad-Command-Center',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export type WorkflowRunStatus = {
  id: number
  status: 'queued' | 'in_progress' | 'completed' | 'waiting'
  conclusion: string | null
  html_url: string
  created_at: string
  updated_at: string
}

/**
 * Triggers a workflow_dispatch event on the given workflow file.
 */
export async function triggerWorkflowDispatch(
  repoUrl: string,
  workflowFileName: string,
  branch = 'main',
  inputs?: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return { success: false, error: 'URL de repo invalida' }

  const { owner, repo } = parsed
  const url = `${GITHUB_API}/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ref: branch,
        ...(inputs ? { inputs } : {}),
      }),
    })

    if (res.status === 204) return { success: true }

    const text = await res.text()
    return { success: false, error: `GitHub API error (${res.status}): ${text}` }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

/**
 * Gets the latest workflow run for a given workflow file.
 */
export async function getLatestWorkflowRun(
  repoUrl: string,
  workflowFileName: string,
  branch = 'main',
): Promise<WorkflowRunStatus | null> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return null

  const { owner, repo } = parsed
  const url = `${GITHUB_API}/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/runs?branch=${branch}&per_page=1`

  try {
    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) return null

    const data = await res.json()
    const run = data.workflow_runs?.[0]
    if (!run) return null

    return {
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      html_url: run.html_url,
      created_at: run.created_at,
      updated_at: run.updated_at,
    }
  } catch {
    return null
  }
}

/**
 * Gets a specific workflow run by ID.
 */
export async function getWorkflowRun(
  repoUrl: string,
  runId: number,
): Promise<WorkflowRunStatus | null> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return null

  const { owner, repo } = parsed
  const url = `${GITHUB_API}/repos/${owner}/${repo}/actions/runs/${runId}`

  try {
    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) return null

    const run = await res.json()
    return {
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      html_url: run.html_url,
      created_at: run.created_at,
      updated_at: run.updated_at,
    }
  } catch {
    return null
  }
}

/**
 * Gets the latest CI run across all workflows for a branch.
 * Useful for checking status after a push (CI triggers automatically).
 */
export async function getLatestCIRun(
  repoUrl: string,
  branch = 'main',
): Promise<(WorkflowRunStatus & { workflowName: string }) | null> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return null

  const { owner, repo } = parsed
  const url = `${GITHUB_API}/repos/${owner}/${repo}/actions/runs?branch=${branch}&per_page=5&event=push`

  try {
    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) return null

    const data = await res.json()
    const run = data.workflow_runs?.[0]
    if (!run) return null

    return {
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      html_url: run.html_url,
      created_at: run.created_at,
      updated_at: run.updated_at,
      workflowName: run.name ?? '',
    }
  } catch {
    return null
  }
}

/**
 * Fetches failure logs from a CI run.
 * Returns truncated log text focused on error lines.
 */
export async function getCIJobLogs(
  repoUrl: string,
  runId: number,
): Promise<string> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return 'Could not parse repo URL'

  const { owner, repo } = parsed

  try {
    // Get jobs for this run
    const jobsRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/actions/runs/${runId}/jobs`,
      { headers: getHeaders() },
    )
    if (!jobsRes.ok) return `Could not fetch jobs (${jobsRes.status})`

    const jobsData = await jobsRes.json()
    const jobs = jobsData.jobs as Array<{
      id: number
      name: string
      conclusion: string | null
      steps: Array<{ name: string; conclusion: string | null; number: number }>
    }>

    const failedJobs = jobs.filter((j) => j.conclusion === 'failure')
    if (!failedJobs.length) return 'No failed jobs found in this run'

    const logParts: string[] = []

    for (const job of failedJobs.slice(0, 2)) {
      const failedSteps = job.steps
        .filter((s) => s.conclusion === 'failure')
        .map((s) => s.name)
        .join(', ')

      logParts.push(`\n=== Job: ${job.name} (failed steps: ${failedSteps || 'unknown'}) ===`)

      // Fetch log for this job
      const logRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/actions/jobs/${job.id}/logs`,
        { headers: getHeaders() },
      )

      if (logRes.ok) {
        const logText = await logRes.text()
        // Keep last 4000 chars — errors are usually at the end
        const truncated = logText.length > 4000 ? '...' + logText.slice(-4000) : logText
        logParts.push(truncated)
      } else {
        logParts.push(`(Could not fetch logs: ${logRes.status})`)
      }
    }

    return logParts.join('\n')
  } catch (e) {
    return `Error fetching CI logs: ${String(e)}`
  }
}

/**
 * Creates a GitHub release (triggers Vercel auto-deploy).
 */
export async function createGitHubRelease(
  repoUrl: string,
  tagName: string,
  releaseName: string,
  body: string,
): Promise<{ success: boolean; html_url?: string; error?: string }> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return { success: false, error: 'URL de repo invalida' }

  const { owner, repo } = parsed
  const url = `${GITHUB_API}/repos/${owner}/${repo}/releases`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        tag_name: tagName,
        name: releaseName,
        body,
        draft: false,
        prerelease: false,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `GitHub API error (${res.status}): ${text}` }
    }

    const data = await res.json()
    return { success: true, html_url: data.html_url }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
