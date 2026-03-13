import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const limit = checkRateLimit(`login:${ip}`, AUTH_RATE_LIMIT)

  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo mas tarde.', retryAfter },
      { status: 429 },
    )
  }

  const body = await request.json()
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos.', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return NextResponse.json(
      { error: 'Email o contrasena incorrectos.', remaining: limit.remaining },
      { status: 401 },
    )
  }

  return NextResponse.json({ ok: true, remaining: limit.remaining })
}
