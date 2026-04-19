import { NextResponse } from 'next/server'
import { requireFinancialAdmin } from '@/lib/admin/require-financial-admin'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/finance/costs — list all operational costs
 * PATCH /api/admin/finance/costs — update one cost
 */

export async function GET() {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('operational_costs')
    .select('id, label, description, monthly_usd, updated_at')
    .order('label')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: Request) {
  const auth = await requireFinancialAdmin()
  if (!auth.allowed) return NextResponse.json(auth.body, { status: auth.status })

  const body = await request.json()
  const { id, monthly_usd } = body as { id: string; monthly_usd: number }

  if (!id || typeof monthly_usd !== 'number' || monthly_usd < 0) {
    return NextResponse.json({ error: 'ID y monto valido requeridos' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('operational_costs')
    .update({ monthly_usd, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
