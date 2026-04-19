import { generateText } from 'ai'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'
import { defaultModel, DEFAULT_MODEL_ID } from '@/lib/ai/anthropic'

/**
 * GET /api/admin/health
 * Quick diagnostic: tests if the Anthropic API key works with a tiny request.
 */
export async function GET() {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return Response.json(auth.body, { status: auth.status })

  const checks: Record<string, { ok: boolean; detail: string }> = {}

  // 1. Check env var exists
  const hasKey = !!process.env.ANTHROPIC_API_KEY
  checks.api_key = {
    ok: hasKey,
    detail: hasKey
      ? `Set (${process.env.ANTHROPIC_API_KEY!.slice(0, 8)}...)`
      : 'ANTHROPIC_API_KEY not set',
  }

  // 2. Test actual API call
  if (hasKey) {
    try {
      const start = Date.now()
      const { text, usage } = await generateText({
        model: defaultModel,
        prompt: 'Responde solo: OK',
        maxOutputTokens: 5,
        temperature: 0,
      })
      const ms = Date.now() - start

      checks.api_call = {
        ok: true,
        detail: `Model ${DEFAULT_MODEL_ID} responded "${text.trim()}" in ${ms}ms (${usage?.inputTokens ?? '?'}in/${usage?.outputTokens ?? '?'}out tokens)`,
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      checks.api_call = {
        ok: false,
        detail: `API call failed: ${msg.slice(0, 500)}`,
      }
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok)

  return Response.json({
    status: allOk ? 'healthy' : 'unhealthy',
    model: DEFAULT_MODEL_ID,
    checks,
  })
}
