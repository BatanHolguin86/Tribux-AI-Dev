import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  builder: process.env.STRIPE_PRICE_BUILDER,
  agency: process.env.STRIPE_PRICE_AGENCY,
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'billing_not_configured', message: 'La facturacion aun no esta configurada. Contacta al administrador.' },
      { status: 503 },
    )
  }

  const body = await request.json()
  const { plan } = body

  if (!plan || !PRICE_MAP[plan]) {
    return NextResponse.json(
      { error: 'Plan invalido', message: 'Selecciona un plan valido: starter, builder, o agency.' },
      { status: 400 },
    )
  }

  const priceId = PRICE_MAP[plan]
  if (!priceId) {
    return NextResponse.json(
      { error: 'price_not_configured', message: `El precio para el plan ${plan} no esta configurado.` },
      { status: 503 },
    )
  }

  try {
    // Create Stripe checkout session via API
    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      success_url: `${APP_URL}/settings?billing=success&plan=${plan}`,
      cancel_url: `${APP_URL}/settings?billing=canceled`,
      'metadata[user_id]': user.id,
      'metadata[plan]': plan,
      customer_email: user.email ?? '',
    })

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await response.json()

    if (!response.ok) {
      console.error('[Billing checkout] Stripe error', session)
      return NextResponse.json(
        { error: 'stripe_error', message: 'Error al crear sesion de pago.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Billing checkout] Error', error)
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 },
    )
  }
}
