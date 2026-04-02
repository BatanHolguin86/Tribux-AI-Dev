/**
 * GitHub commit functions using REST API.
 * Creates commits with multiple files via the Git Data API.
 */

import { parseGitHubUrl } from './repo-context'

const GITHUB_API = 'https://api.github.com'

function getToken(): string {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN is required to commit files')
  return token
}

function getHeaders(): Record<string, string> {
  return {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'AI-Squad-Command-Center',
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  }
}

type CommitFile = {
  path: string
  content: string
}

type CommitResult = {
  sha: string
  url: string
  filesChanged: number
}

/**
 * Commits multiple files to a GitHub repo using the Git Data API.
 *
 * Flow:
 * 1. Get current HEAD SHA + base tree SHA
 * 2. Create blobs for each file
 * 3. Create new tree with blobs
 * 4. Create commit pointing to new tree
 * 5. Update branch ref
 */
export async function commitMultipleFiles(
  repoUrl: string,
  files: CommitFile[],
  message: string,
  branch = 'main',
): Promise<CommitResult> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) throw new Error('Invalid GitHub URL')

  const { owner, repo } = parsed
  const headers = getHeaders()
  const base = `${GITHUB_API}/repos/${owner}/${repo}`

  // 1. Get current HEAD ref
  const refRes = await fetch(`${base}/git/ref/heads/${branch}`, { headers })
  if (!refRes.ok) {
    throw new Error(`Failed to get branch ref: ${refRes.status}`)
  }
  const refData = await refRes.json()
  const headSha = refData.object.sha

  // 2. Get base tree SHA from HEAD commit
  const commitRes = await fetch(`${base}/git/commits/${headSha}`, { headers })
  if (!commitRes.ok) {
    throw new Error(`Failed to get HEAD commit: ${commitRes.status}`)
  }
  const commitData = await commitRes.json()
  const baseTreeSha = commitData.tree.sha

  // 3. Create blobs for each file (parallel)
  const blobPromises = files.map(async (file) => {
    const blobRes = await fetch(`${base}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: file.content,
        encoding: 'utf-8',
      }),
    })
    if (!blobRes.ok) {
      throw new Error(`Failed to create blob for ${file.path}: ${blobRes.status}`)
    }
    const blobData = await blobRes.json()
    return {
      path: file.path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blobData.sha as string,
    }
  })

  const treeItems = await Promise.all(blobPromises)

  // 4. Create new tree
  const treeRes = await fetch(`${base}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  })
  if (!treeRes.ok) {
    throw new Error(`Failed to create tree: ${treeRes.status}`)
  }
  const treeData = await treeRes.json()

  // 5. Create commit
  const newCommitRes = await fetch(`${base}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [headSha],
    }),
  })
  if (!newCommitRes.ok) {
    throw new Error(`Failed to create commit: ${newCommitRes.status}`)
  }
  const newCommitData = await newCommitRes.json()

  // 6. Update branch ref
  const updateRefRes = await fetch(`${base}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: newCommitData.sha,
    }),
  })
  if (!updateRefRes.ok) {
    throw new Error(`Failed to update ref: ${updateRefRes.status}`)
  }

  return {
    sha: newCommitData.sha,
    url: `https://github.com/${owner}/${repo}/commit/${newCommitData.sha}`,
    filesChanged: files.length,
  }
}

/**
 * Create a branch from main (or another base branch).
 * If branch already exists, returns silently.
 */
export async function createBranch(
  repoUrl: string,
  branchName: string,
  baseBranch = 'main',
): Promise<{ created: boolean; error?: string }> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return { created: false, error: 'Invalid repo URL' }

  const { owner, repo } = parsed
  const headers = getHeaders()
  const base = `${GITHUB_API}/repos/${owner}/${repo}`

  // Get base branch SHA
  const refRes = await fetch(`${base}/git/ref/heads/${baseBranch}`, { headers })
  if (!refRes.ok) return { created: false, error: `Base branch ${baseBranch} not found` }
  const refData = await refRes.json()
  const sha = refData.object.sha

  // Create new branch ref
  const createRes = await fetch(`${base}/git/refs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  })

  if (createRes.status === 422) {
    // Branch already exists — not an error
    return { created: true }
  }

  if (!createRes.ok) {
    const text = await createRes.text()
    return { created: false, error: `Create branch failed: ${text.slice(0, 200)}` }
  }

  return { created: true }
}

/**
 * Create a Pull Request from a feature branch to main.
 */
export async function createPullRequest(
  repoUrl: string,
  head: string,
  title: string,
  body: string,
  baseBranch = 'main',
): Promise<{ success: boolean; pr_number?: number; html_url?: string; error?: string }> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return { success: false, error: 'Invalid repo URL' }

  const { owner, repo } = parsed
  const headers = getHeaders()

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title,
      body,
      head,
      base: baseBranch,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return { success: false, error: `Create PR failed (${res.status}): ${text.slice(0, 200)}` }
  }

  const data = await res.json()
  return { success: true, pr_number: data.number, html_url: data.html_url }
}

/**
 * Merge a Pull Request.
 */
export async function mergePullRequest(
  repoUrl: string,
  prNumber: number,
  mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash',
): Promise<{ success: boolean; sha?: string; error?: string }> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return { success: false, error: 'Invalid repo URL' }

  const { owner, repo } = parsed
  const headers = getHeaders()

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ merge_method: mergeMethod }),
  })

  if (!res.ok) {
    const text = await res.text()
    return { success: false, error: `Merge failed (${res.status}): ${text.slice(0, 200)}` }
  }

  const data = await res.json()
  return { success: true, sha: data.sha }
}
