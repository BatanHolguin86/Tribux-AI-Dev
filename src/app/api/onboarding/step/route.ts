import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateStepSchema = z.object({
  step: z.number().int().min(0).max(4),
})

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = updateStepSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Step invalido', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ onboarding_step: parsed.data.step })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json(
      { error: 'Error al actualizar step' },
      { status: 500 }
    )
  }

  return NextResponse.json({ step: parsed.data.step })
}
