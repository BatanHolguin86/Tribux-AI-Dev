import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { registerSchema } from '@/lib/validations/auth'
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const limit = checkRateLimit(`register:${ip}`, AUTH_RATE_LIMIT)

  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo mas tarde.', retryAfter },
      { status: 429 },
    )
  }

  const body = await request.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos.', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return NextResponse.json(
        { error: 'Este email ya esta registrado. Intenta iniciar sesion.' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'Error al crear la cuenta. Intenta de nuevo.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
