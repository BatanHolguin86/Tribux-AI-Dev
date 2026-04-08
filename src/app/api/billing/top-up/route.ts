import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CREDIT_PACKS } from '@/lib/plans/credit-packs'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const maxDuration = 30

const TOP_UP_RATE_LIMIT = { maxAttempts: 5, windowMs: 60 * 60 * 1000 }

/**
 * POST /api/billing/top-up
 * Purchase additional AI credits for the current month.
 *
 * Body: { packId: 'small' | 'medium' | 'large' }
 *
 * If Stripe is configured, creates a Checkout Session for one-time payment.
 * If Stripe is NOT configured (dev/staging), credits are added immediately.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    // Rate limit
    const ip = getClientIp(request)
    const rateResult = checkRateLimit(`topup:${user.id}:${ip}`, TOP_UP_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json({ error: 'rate_limited' }, { status: 429 })
    }

    const body = await request.json()
    const packId = body.packId as string

    const pack = CREDIT_PACKS.find((p) => p.id === packId)
    if (!pack) {
      return Response.json(
        { error: 'invalid_pack', message: 'Pack no valido.' },
        { status: 400 },
      )
    }

    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const stripeKey = process.env.STRIPE_SECRET_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // If Stripe is configured, create a one-time checkout
    if (stripeKey) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      const sessionBody: Record<string, unknown> = {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `AI Credits — ${pack.label}`,
                description: `${pack.amountUsd} USD de creditos de IA adicionales para este mes`,
              },
              unit_amount: Math.round(pack.priceUsd * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/settings?topup=success&pack=${packId}`,
        cancel_url: `${appUrl}/settings?topup=canceled`,
        metadata: {
          user_id: user.id,
          pack_id: packId,
          amount_usd: String(pack.amountUsd),
          month,
          type: 'credit_top_up',
        },
      }

      if (profile?.stripe_customer_id) {
        sessionBody.customer = profile.stripe_customer_id
      } else {
        sessionBody.customer_email = user.email
      }

      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(flattenForStripe(sessionBody)).toString(),
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('[top-up] Stripe error:', text)
        return Response.json(
          { error: 'stripe_error', message: 'Error al procesar el pago.' },
          { status: 502 },
        )
      }

      const session = await res.json()
      return Response.json({ url: session.url })
    }

    // No Stripe → add credits immediately (dev/staging mode)
    const admin = await createAdminClient()
    await admin.from('credit_purchases').insert({
      user_id: user.id,
      amount_usd: pack.amountUsd,
      price_usd: pack.priceUsd,
      month,
      status: 'completed',
    })

    return Response.json({
      success: true,
      message: `Se agregaron $${pack.amountUsd} de creditos de IA para este mes.`,
      amountUsd: pack.amountUsd,
    })
  } catch (error) {
    console.error('[top-up] Error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}

/**
 * Flatten nested objects for Stripe's URL-encoded API format.
 * { line_items: [{ price_data: { currency: 'usd' } }] }
 * → 'line_items[0][price_data][currency]=usd'
 */
function flattenForStripe(
  obj: Record<string, unknown>,
  prefix = '',
): Array<[string, string]> {
  const entries: Array<[string, string]> = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key

    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'object' && item !== null) {
          entries.push(...flattenForStripe(item as Record<string, unknown>, `${fullKey}[${i}]`))
        } else {
          entries.push([`${fullKey}[${i}]`, String(item)])
        }
      })
    } else if (typeof value === 'object' && value !== null) {
      entries.push(...flattenForStripe(value as Record<string, unknown>, fullKey))
    } else if (value !== undefined && value !== null) {
      entries.push([fullKey, String(value)])
    }
  }

  return entries
}
