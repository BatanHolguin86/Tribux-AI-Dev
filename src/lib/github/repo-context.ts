/**
 * Fetches public GitHub repo context (file tree + recent commits)
 * for injection into agent prompts. Works with public repos without auth.
 * If a GitHub token is configured (platform_config or GITHUB_TOKEN env),
 * also works with private repos.
 */

import { getPlatformToken } from '@/lib/platform/config'

const GITHUB_API = 'https://api.github.com'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

type RepoContext = {
  tree: string
  recentCommits: string
}

// Simple in-memory cache to avoid hitting GitHub API on every chat message
const cache = new Map<string, { data: RepoContext; timestamp: number }>()

/** Parse "github.com/owner/repo" from a URL */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    if (!parsed.hostname.includes('github.com')) return null
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') }
  } catch {
    return null
  }
}

async function getHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Tribux AI',
  }
  let ghToken = process.env.GITHUB_TOKEN ?? ''
  try {
    const platform = await getPlatformToken('github')
    ghToken = platform.token
  } catch { /* fallback to GITHUB_TOKEN env var */ }
  if (ghToken) {
    headers.Authorization = `Bearer ${ghToken}`
  }
  return headers
}

async function fetchTree(owner: string, repo: string): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers: await getHeaders(), next: { revalidate: 300 } }
  )
  if (!res.ok) return ''

  const data = await res.json()
  const tree = (data.tree as Array<{ path: string; type: string }>) ?? []

  // Filter to meaningful files, skip node_modules, .next, etc.
  const SKIP_PATTERNS = [
    /^node_modules\//,
    /^\.next\//,
    /^\.git\//,
    /^dist\//,
    /^build\//,
    /^coverage\//,
    /^\.turbo\//,
    /\.lock$/,
    /\.map$/,
  ]

  const meaningful = tree
    .filter((t) => t.type === 'blob' && !SKIP_PATTERNS.some((p) => p.test(t.path)))
    .map((t) => t.path)
    .slice(0, 200) // Cap to avoid huge trees

  return meaningful.join('\n')
}

async function fetchRecentCommits(owner: string, repo: string): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=10`,
    { headers: await getHeaders(), next: { revalidate: 300 } }
  )
  if (!res.ok) return ''

  const commits = (await res.json()) as Array<{
    sha: string
    commit: { message: string; author: { name: string; date: string } }
  }>

  return commits
    .map((c) => {
      const date = new Date(c.commit.author.date).toLocaleDateString('es', {
        day: 'numeric',
        month: 'short',
      })
      const msg = c.commit.message.split('\n')[0].slice(0, 80)
      return `- ${date}: ${msg} (${c.sha.slice(0, 7)})`
    })
    .join('\n')
}

/**
 * Fetch GitHub repo context. Returns empty strings if repo is inaccessible.
 * Results are cached for 5 minutes.
 */
export async function getGitHubRepoContext(repoUrl: string): Promise<RepoContext> {
  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) return { tree: '', recentCommits: '' }

  const cacheKey = `${parsed.owner}/${parsed.repo}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const [tree, recentCommits] = await Promise.all([
      fetchTree(parsed.owner, parsed.repo),
      fetchRecentCommits(parsed.owner, parsed.repo),
    ])

    const result = { tree, recentCommits }
    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  } catch {
    return { tree: '', recentCommits: '' }
  }
}

/** Format repo context for agent prompt injection */
export function formatRepoContext(ctx: RepoContext): string {
  if (!ctx.tree && !ctx.recentCommits) return ''

  let result = ''
  if (ctx.tree) {
    result += `#### Estructura del Repositorio\n\`\`\`\n${ctx.tree}\n\`\`\`\n\n`
  }
  if (ctx.recentCommits) {
    result += `#### Commits Recientes\n${ctx.recentCommits}`
  }
  return result
}
