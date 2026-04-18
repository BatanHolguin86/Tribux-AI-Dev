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
    'User-Agent': 'Tribux AI',
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
 * Gets the latest GitHub Deployment for a repo (environment: Production).
 * Vercel creates these automatically when it deploys via GitHub integration.
 */
export async function getLatestGitHubDeployment(
  repoUrl: string,
  environment = 'Production',
): Promise<{
  id: number
  status: string
  environmentUrl: string | null
  createdAt: string
} | null> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return null

  const { owner, repo } = parsed

  try {
    // 1. Get latest deployment for environment
    const deplRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/deployments?environment=${encodeURIComponent(environment)}&per_page=1`,
      { headers: getHeaders() },
    )
    if (!deplRes.ok) return null

    const deplData = await deplRes.json()
    const deployment = deplData[0]
    if (!deployment) return null

    // 2. Get its latest status
    const statusRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/deployments/${deployment.id}/statuses?per_page=1`,
      { headers: getHeaders() },
    )
    if (!statusRes.ok) return null

    const statuses = await statusRes.json()
    const latest = statuses[0]

    return {
      id: deployment.id,
      status: latest?.state ?? 'pending',
      environmentUrl: latest?.environment_url ?? null,
      createdAt: deployment.created_at,
    }
  } catch {
    return null
  }
}

/**
 * Get the latest preview deployment for a branch (Vercel creates these for PRs).
 */
export async function getPreviewDeployment(
  repoUrl: string,
  branch: string,
): Promise<{ url: string; status: string; createdAt: string } | null> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return null

  const { owner, repo } = parsed

  try {
    // Fetch recent deployments for Preview environment
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/deployments?environment=Preview&per_page=10`,
      { headers: getHeaders() },
    )
    if (!res.ok) return null

    const deployments = await res.json()

    // Find one matching the branch
    const match = (deployments as Array<{ id: number; ref: string; created_at: string }>)
      .find((d) => d.ref === branch)

    if (!match) return null

    // Get status
    const statusRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/deployments/${match.id}/statuses?per_page=1`,
      { headers: getHeaders() },
    )
    if (!statusRes.ok) return null

    const statuses = await statusRes.json()
    const latest = statuses[0] as { state: string; environment_url?: string } | undefined

    return {
      url: latest?.environment_url ?? '',
      status: latest?.state ?? 'pending',
      createdAt: match.created_at,
    }
  } catch {
    return null
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

/**
 * Get the two most recent releases to identify rollback target.
 * Returns [current, previous] or null if not enough releases.
 */
export async function getRollbackTarget(
  repoUrl: string,
): Promise<{ tag: string; commitSha: string; name: string; publishedAt: string } | null> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return null

  const { owner, repo } = parsed
  const url = `${GITHUB_API}/repos/${owner}/${repo}/releases?per_page=2`

  try {
    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) return null

    const releases = (await res.json()) as Array<{
      tag_name: string
      target_commitish: string
      name: string
      published_at: string
    }>

    if (releases.length < 2) return null

    // Previous release is the rollback target (index 1)
    const prev = releases[1]
    return {
      tag: prev.tag_name,
      commitSha: prev.target_commitish,
      name: prev.name,
      publishedAt: prev.published_at,
    }
  } catch {
    return null
  }
}

/**
 * Create a GitHub release targeting a specific commit SHA (for rollback).
 */
export async function createRollbackRelease(
  repoUrl: string,
  targetCommitSha: string,
  originalTag: string,
): Promise<{ success: boolean; html_url?: string; tagName?: string; error?: string }> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return { success: false, error: 'URL de repo invalida' }

  const { owner, repo } = parsed
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = now.toISOString().slice(11, 16).replace(':', '')
  const tagName = `rollback-${dateStr}-${timeStr}`
  const releaseName = `Rollback to ${originalTag}`
  const body = `Rollback deployment to previous release \`${originalTag}\`.\n\nTarget commit: \`${targetCommitSha}\`\nTriggered at: ${now.toISOString()}`

  const url = `${GITHUB_API}/repos/${owner}/${repo}/releases`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        tag_name: tagName,
        target_commitish: targetCommitSha,
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
    return { success: true, html_url: data.html_url, tagName }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
