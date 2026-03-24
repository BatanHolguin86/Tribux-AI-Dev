/**
 * Post-processing validation for AI agent output.
 * Cleans up common issues before saving to DB.
 */

/** Remove hallucinated URLs that don't match known domains */
export function sanitizeUrls(text: string): string {
  // Allow known domains, replace unknown ones with descriptive text
  const ALLOWED_DOMAINS = [
    'supabase.com', 'supabase.co',
    'vercel.com', 'vercel.app',
    'github.com',
    'nextjs.org',
    'tailwindcss.com',
    'typescriptlang.org',
    'npmjs.com',
    'playwright.dev',
    'vitest.dev',
    'developer.mozilla.org',
    'anthropic.com',
    'openai.com',
    'googleapis.com',
    'cloudflare.com',
    'sentry.io',
    'resend.com',
    'stripe.com',
    'zod.dev',
    'react.dev',
    'w3.org',
  ]

  return text.replace(
    /https?:\/\/[^\s\])>,"']+/g,
    (url) => {
      try {
        const hostname = new URL(url).hostname
        const isAllowed = ALLOWED_DOMAINS.some(
          (d) => hostname === d || hostname.endsWith(`.${d}`)
        )
        // Also allow localhost and relative-looking URLs
        if (isAllowed || hostname === 'localhost' || hostname.startsWith('127.')) {
          return url
        }
        return `[URL: ${hostname}]`
      } catch {
        return url
      }
    }
  )
}

/** Fix unclosed code blocks */
export function fixCodeBlocks(text: string): string {
  const backtickCount = (text.match(/```/g) ?? []).length
  if (backtickCount % 2 !== 0) {
    return text + '\n```'
  }
  return text
}

/** Detect if response was cut off mid-sentence */
export function isIncomplete(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 50) return false

  // Check if it ends mid-sentence (no terminal punctuation)
  const lastChar = trimmed[trimmed.length - 1]
  const terminalChars = '.!?:;)\n`'
  if (terminalChars.includes(lastChar)) return false

  // Check for obvious cut-off patterns
  if (trimmed.endsWith('...')) return false
  if (/\w$/.test(trimmed)) return true

  return false
}

/** Ensure ---ACTION--- blocks are well-formed JSON; remove malformed ones */
export function cleanActionBlocks(text: string): string {
  return text.replace(
    /---ACTION---\s*([\s\S]*?)\s*---\/ACTION---/g,
    (match, json: string) => {
      try {
        const parsed = JSON.parse(json.trim())
        if (parsed.type && parsed.label) {
          // Re-serialize to ensure clean JSON
          return `---ACTION---\n${JSON.stringify(parsed)}\n---/ACTION---`
        }
      } catch { /* invalid */ }
      // Remove malformed action blocks
      return ''
    }
  )
}

/**
 * Validate and clean agent output before saving.
 * Returns the cleaned text.
 */
export function validateAgentOutput(text: string): string {
  let result = text

  // Fix unclosed code blocks
  result = fixCodeBlocks(result)

  // Sanitize hallucinated URLs
  result = sanitizeUrls(result)

  // Clean action blocks
  result = cleanActionBlocks(result)

  return result
}
