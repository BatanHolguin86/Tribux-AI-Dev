import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { checkRateLimit, getClientIp, FORGOT_PASSWORD_RATE_LIMIT } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const limit = checkRateLimit(`forgot:${ip}`, FORGOT_PASSWORD_RATE_LIMIT)

  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo mas tarde.', retryAfter },
      { status: 429 },
    )
  }

  const body = await request.json()
  const parsed = forgotPasswordSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Email invalido.' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Always return success to avoid leaking whether the email exists
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/reset-password`,
  })

  return NextResponse.json({ ok: true })
}
