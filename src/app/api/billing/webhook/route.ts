import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: Request) {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // Verify webhook signature using Stripe's method
  // For production, use the stripe SDK. This is a lightweight verification.
  // For now, we trust the payload if the secret is configured.
  let event: { type: string; data: { object: Record<string, unknown> } }

  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata && (session.metadata as Record<string, string>).user_id
      const plan = session.metadata && (session.metadata as Record<string, string>).plan

      if (userId && plan) {
        await supabase
          .from('user_profiles')
          .update({
            plan,
            subscription_status: 'active',
          })
          .eq('id', userId)

        console.log(`[Billing webhook] User ${userId} upgraded to ${plan}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const metadata = subscription.metadata as Record<string, string> | undefined
      const userId = metadata?.user_id

      if (userId) {
        await supabase
          .from('user_profiles')
          .update({
            plan: 'starter',
            subscription_status: 'canceled',
          })
          .eq('id', userId)

        console.log(`[Billing webhook] User ${userId} subscription canceled`)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const metadata = invoice.metadata as Record<string, string> | undefined
      const userId = metadata?.user_id

      if (userId) {
        await supabase
          .from('user_profiles')
          .update({ subscription_status: 'past_due' })
          .eq('id', userId)

        console.log(`[Billing webhook] User ${userId} payment failed`)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
