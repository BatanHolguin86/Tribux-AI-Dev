import { parseGitHubUrl } from '@/lib/github/repo-context'
import { getPlatformToken } from './config'

const VERCEL_API = 'https://api.vercel.com'

async function getConfig() {
  const { token, metadata } = await getPlatformToken('vercel')
  return { token, teamId: metadata.team_id }
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function createProject(
  projectSlug: string,
  repoUrl: string,
): Promise<{ projectId: string; url: string }> {
  const { token, teamId } = await getConfig()

  const parsed = parseGitHubUrl(repoUrl)
  if (!parsed) throw new Error('Invalid GitHub repo URL for Vercel project')

  const teamParam = teamId ? `?teamId=${teamId}` : ''

  const res = await fetch(`${VERCEL_API}/v10/projects${teamParam}`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      name: projectSlug,
      framework: 'nextjs',
      gitRepository: {
        type: 'github',
        repo: `${parsed.owner}/${parsed.repo}`,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Vercel create project failed (${res.status}): ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  return {
    projectId: data.id,
    url: `https://${projectSlug}.vercel.app`,
  }
}
