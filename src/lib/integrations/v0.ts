/**
 * Parse and validate a V0 share URL.
 * Supports: https://v0.dev/t/{id}, https://v0.dev/chat/{id}
 */
export function parseV0Url(url: string): { id: string; url: string } | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('v0.dev')) return null

    const match = u.pathname.match(/\/(t|chat)\/([a-zA-Z0-9]+)/)
    if (!match) return null

    return { id: match[2], url }
  } catch {
    return null
  }
}
