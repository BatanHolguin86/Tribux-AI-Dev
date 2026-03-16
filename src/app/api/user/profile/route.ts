import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : undefined

  if (!fullName || fullName.length === 0 || fullName.length > 100) {
    return NextResponse.json({ error: 'Nombre invalido' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
