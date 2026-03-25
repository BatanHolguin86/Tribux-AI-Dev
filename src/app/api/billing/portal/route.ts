import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'billing_not_configured', message: 'La facturacion no esta configurada.' },
      { status: 503 },
    )
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No tienes una suscripcion activa para gestionar.' },
      { status: 400 },
    )
  }

  try {
    const params = new URLSearchParams({
      customer: profile.stripe_customer_id,
      return_url: `${APP_URL}/settings`,
    })

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await response.json()

    if (!response.ok) {
      console.error('[Billing portal] Stripe error', session)
      return NextResponse.json(
        { error: 'Error al crear sesion del portal.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Billing portal] Error', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud.' },
      { status: 500 },
    )
  }
}
