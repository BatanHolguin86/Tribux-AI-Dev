import crypto from 'crypto'
import { getPlatformToken } from './config'

const GITHUB_API = 'https://api.github.com'

async function getConfig() {
  const { token, metadata } = await getPlatformToken('github')
  const org = metadata.org
  if (!org) throw new Error('GitHub org not configured (metadata.org or PLATFORM_GITHUB_ORG)')
  return { token, org }
}

function headers(token: string) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Tribux AI',
    'Content-Type': 'application/json',
  }
}

export function slugifyProjectName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  const suffix = crypto.randomBytes(3).toString('hex')
  return `${base}-${suffix}`
}

export async function createRepository(
  slug: string,
  description: string,
): Promise<{ repoUrl: string; cloneUrl: string; defaultBranch: string }> {
  const { token, org } = await getConfig()

  const res = await fetch(`${GITHUB_API}/orgs/${org}/repos`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      name: slug,
      description,
      private: true,
      auto_init: true,
      gitignore_template: 'Node',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub create repo failed (${res.status}): ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  return {
    repoUrl: data.html_url,
    cloneUrl: data.clone_url,
    defaultBranch: data.default_branch ?? 'main',
  }
}
