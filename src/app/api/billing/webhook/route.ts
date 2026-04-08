import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
): Promise<boolean> {
  const parts = header.split(',')
  let timestamp = ''
  let signature = ''

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    if (key === 'v1') signature = value
  }

  if (!timestamp || !signature) return false

  // Reject if timestamp is older than 5 minutes (replay protection)
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
  if (age > 300) return false

  const signedPayload = `${timestamp}.${payload}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return computed === signature
}

export async function POST(request: Request) {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const valid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET)
  if (!valid) {
    console.error('[Billing webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { type: string; data: { object: Record<string, unknown> } }

  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Use admin client — webhooks have no cookie session
  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const metadata = (session.metadata ?? {}) as Record<string, string>
      const userId = metadata.user_id
      const plan = metadata.plan
      const customerId = session.customer as string | undefined

      // Credit top-up purchase
      if (metadata.type === 'credit_top_up' && userId) {
        const amountUsd = parseFloat(metadata.amount_usd ?? '0')
        const month = metadata.month
        const packId = metadata.pack_id
        const priceUsd = (session.amount_total as number | undefined)
          ? (session.amount_total as number) / 100
          : amountUsd

        if (amountUsd > 0 && month) {
          await supabase.from('credit_purchases').insert({
            user_id: userId,
            amount_usd: amountUsd,
            price_usd: priceUsd,
            month,
            stripe_payment_id: session.id as string,
            status: 'completed',
          })
          console.log(`[Billing webhook] User ${userId} purchased credit pack ${packId}: $${amountUsd} for month ${month}`)
        }
        break
      }

      // Plan upgrade
      if (userId && plan) {
        await supabase
          .from('user_profiles')
          .update({
            plan,
            subscription_status: 'active',
            ...(customerId ? { stripe_customer_id: customerId } : {}),
          })
          .eq('id', userId)

        console.log(`[Billing webhook] User ${userId} upgraded to ${plan}, customer: ${customerId}`)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const customerId = subscription.customer as string | undefined
      const status = subscription.status as string | undefined

      if (customerId && status) {
        const statusMap: Record<string, string> = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'canceled',
          trialing: 'trialing',
          unpaid: 'past_due',
        }

        const mappedStatus = statusMap[status] ?? status

        await supabase
          .from('user_profiles')
          .update({ subscription_status: mappedStatus })
          .eq('stripe_customer_id', customerId)

        console.log(`[Billing webhook] Customer ${customerId} subscription status: ${mappedStatus}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const customerId = subscription.customer as string | undefined

      if (customerId) {
        await supabase
          .from('user_profiles')
          .update({
            plan: 'starter',
            subscription_status: 'canceled',
          })
          .eq('stripe_customer_id', customerId)

        console.log(`[Billing webhook] Customer ${customerId} subscription canceled`)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId = invoice.customer as string | undefined

      if (customerId) {
        await supabase
          .from('user_profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        console.log(`[Billing webhook] Customer ${customerId} payment failed`)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
