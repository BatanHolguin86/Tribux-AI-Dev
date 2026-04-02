import { parseGitHubUrl } from '@/lib/github/repo-context'

const VERCEL_API = 'https://api.vercel.com'

function getConfig() {
  const token = process.env.PLATFORM_VERCEL_TOKEN
  const teamId = process.env.PLATFORM_VERCEL_TEAM_ID
  if (!token) throw new Error('PLATFORM_VERCEL_TOKEN is required')
  return { token, teamId }
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
  const { token, teamId } = getConfig()

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
