/**
 * In-memory rate limiter for API routes.
 * Limits requests per IP within a sliding window.
 * Suitable for serverless (Vercel) — state resets on cold start,
 * which is acceptable for auth rate limiting (brute force mitigation).
 */

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

type RateLimitConfig = {
  /** Max number of requests allowed in the window */
  maxAttempts: number
  /** Window duration in milliseconds */
  windowMs: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request is allowed under rate limiting.
 * @param key Unique identifier (e.g., IP address or IP+action)
 * @param config Rate limit configuration
 * @returns Whether the request is allowed and remaining attempts
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxAttempts - 1, resetAt: now + config.windowMs }
  }

  entry.count++

  if (entry.count > config.maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: config.maxAttempts - entry.count, resetAt: entry.resetAt }
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers)
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

/** Preset: Auth endpoints — 5 attempts per 15 minutes */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
}

/** Preset: Forgot password — 3 attempts per 15 minutes */
export const FORGOT_PASSWORD_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
}
