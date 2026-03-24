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
