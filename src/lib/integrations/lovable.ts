/**
 * Parse and validate a Lovable project URL.
 * Supports: https://lovable.dev/projects/{id}, https://*.lovable.app
 */
export function parseLovableUrl(url: string): { url: string } | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('lovable.dev') || u.hostname.includes('lovable.app')) {
      return { url }
    }
    return null
  } catch {
    return null
  }
}
