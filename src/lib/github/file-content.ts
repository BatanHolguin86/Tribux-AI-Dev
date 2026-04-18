/**
 * Fetches file contents from a GitHub repository via the Contents API.
 */

import { parseGitHubUrl } from './repo-context'

const GITHUB_API = 'https://api.github.com'

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Tribux AI',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

/**
 * Fetches the content of a single file from GitHub.
 * Returns null if the file doesn't exist or can't be read.
 */
export async function fetchFileContent(
  repoUrl: string,
  filePath: string,
  branch = 'main',
): Promise<string | null> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return null

  const { owner, repo } = parsed
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`

  try {
    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) return null

    const data = await res.json()
    if (data.encoding === 'base64' && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    return null
  } catch {
    return null
  }
}

/**
 * Fetches multiple files from GitHub in parallel.
 * Returns a map of filePath → content. Missing files are omitted.
 */
export async function fetchMultipleFiles(
  repoUrl: string,
  filePaths: string[],
  branch = 'main',
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  const promises = filePaths.map(async (filePath) => {
    const content = await fetchFileContent(repoUrl, filePath, branch)
    if (content !== null) {
      results[filePath] = content
    }
  })

  await Promise.all(promises)
  return results
}

type CodeSearchResult = {
  path: string
  url: string
  snippet: string
}

/**
 * Searches code in a GitHub repository using the Search API.
 * Returns up to 10 matching files with a text snippet.
 */
export async function searchCode(
  repoUrl: string,
  query: string,
): Promise<CodeSearchResult[]> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return []

  const { owner, repo } = parsed
  const q = encodeURIComponent(`${query} repo:${owner}/${repo}`)
  const url = `${GITHUB_API}/search/code?q=${q}&per_page=10`

  try {
    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) return []

    const data = await res.json()
    if (!Array.isArray(data.items)) return []

    return (data.items as Array<{ path: string; html_url: string; text_matches?: Array<{ fragment: string }> }>).map(
      (item) => ({
        path: item.path,
        url: item.html_url,
        snippet: item.text_matches?.[0]?.fragment ?? '',
      }),
    )
  } catch {
    return []
  }
}

/**
 * Fetches the directory listing from GitHub.
 * Returns file paths (not directories) within the given path.
 */
export async function fetchDirectoryListing(
  repoUrl: string,
  dirPath: string,
  branch = 'main',
): Promise<string[]> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return []

  const { owner, repo } = parsed
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(dirPath)}?ref=${branch}`

  try {
    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) return []

    const data = await res.json()
    if (!Array.isArray(data)) return []

    return data
      .filter((item: { type: string }) => item.type === 'file')
      .map((item: { path: string }) => item.path)
  } catch {
    return []
  }
}
