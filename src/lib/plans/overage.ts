'server-only'

import { createAdminClient } from '@/lib/supabase/server'

export type OverageStatus = 'pending' | 'billed' | 'waived' | 'error'

export type OverageLedgerEntry = {
  id: string
  userId: string
  month: string
  plan: string
  budgetUsd: number
  usedUsd: number
  overageUsd: number
  overageMultiplier: number
  chargeUsd: number
  stripeInvoiceItemId: string | null
  stripeInvoiceId: string | null
  status: OverageStatus
  errorMessage: string | null
  billedAt: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Sync — compute overage for all users in a given month
// ---------------------------------------------------------------------------

/**
 * Computes overage for every user who exceeded their budget in `month`.
 * Upserts into overage_ledger (safe to re-run — idempotent for pending entries).
 * Returns the number of entries created or updated.
 */
export async function syncMonthOverage(month: string): Promise<{ synced: number; errors: string[] }> {
  const admin = await createAdminClient()
  const errors: string[] = []

  const monthStart = `${month}-01`
  const [year, mon] = month.split('-').map(Number)
  const nextMonthDate = new Date(year, mon, 1) // JavaScript months are 0-indexed
  const monthEnd = nextMonthDate.toISOString().slice(0, 10)

  // 1. Aggregate AI spend per user for the month
  const { data: usageRows, error: usageErr } = await admin
    .from('ai_usage_events')
    .select('user_id, estimated_cost_usd')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  if (usageErr) {
    return { synced: 0, errors: [`Failed to fetch usage: ${usageErr.message}`] }
  }

  // Aggregate by user
  const spendByUser = new Map<string, number>()
  for (const row of usageRows ?? []) {
    const prev = spendByUser.get(row.user_id) ?? 0
    spendByUser.set(row.user_id, prev + Number(row.estimated_cost_usd ?? 0))
  }

  if (spendByUser.size === 0) return { synced: 0, errors: [] }

  // 2. Load plans + budgets for these users
  const userIds = Array.from(spendByUser.keys())
  const { data: profiles } = await admin
    .from('user_profiles')
    .select('id, plan')
    .in('id', userIds)

  const planByUser = new Map<string, string>()
  for (const p of profiles ?? []) planByUser.set(p.id, p.plan ?? 'starter')

  const uniquePlans = [...new Set(planByUser.values())]
  const { data: targets } = await admin
    .from('plan_cost_targets')
    .select('plan, monthly_ai_budget_usd, overage_multiplier')
    .in('plan', uniquePlans)

  const FALLBACK_BUDGET: Record<string, number> = {
    starter: 44.7, builder: 89.7, agency: 209.7, enterprise: 500,
  }
  const budgetByPlan = new Map<string, { budget: number; multiplier: number }>()
  for (const t of targets ?? []) {
    budgetByPlan.set(t.plan, {
      budget: Number(t.monthly_ai_budget_usd),
      multiplier: Number(t.overage_multiplier ?? 1.5),
    })
  }

  // 3. Upsert overage_ledger for users who exceeded budget
  let synced = 0
  for (const [userId, usedUsd] of spendByUser) {
    const plan = planByUser.get(userId) ?? 'starter'
    const { budget, multiplier } = budgetByPlan.get(plan) ?? {
      budget: FALLBACK_BUDGET[plan] ?? 44.7,
      multiplier: 1.5,
    }

    if (usedUsd <= budget) continue // no overage

    const overageUsd = usedUsd - budget
    const chargeUsd = Math.round(overageUsd * multiplier * 10000) / 10000

    const { error: upsertErr } = await admin.from('overage_ledger').upsert(
      {
        user_id: userId,
        month,
        plan,
        budget_usd: Math.round(budget * 10000) / 10000,
        used_usd: Math.round(usedUsd * 10000) / 10000,
        overage_usd: Math.round(overageUsd * 10000) / 10000,
        overage_multiplier: multiplier,
        charge_usd: chargeUsd,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,month',
        // Don't overwrite already-billed entries
        ignoreDuplicates: false,
      },
    )

    if (upsertErr) {
      errors.push(`User ${userId}: ${upsertErr.message}`)
    } else {
      synced++
    }
  }

  return { synced, errors }
}

// ---------------------------------------------------------------------------
// Bill — create Stripe Invoice Item for a ledger entry
// ---------------------------------------------------------------------------

/**
 * Creates a Stripe Invoice Item for the given overage_ledger entry.
 * Updates the ledger entry with the Stripe IDs and status.
 * Returns the updated ledger entry.
 */
export async function billOverageEntry(ledgerId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await createAdminClient()
  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (!stripeKey) {
    return { ok: false, error: 'STRIPE_SECRET_KEY not configured' }
  }

  // Load the ledger entry
  const { data: entry, error: fetchErr } = await admin
    .from('overage_ledger')
    .select('*')
    .eq('id', ledgerId)
    .single()

  if (fetchErr || !entry) {
    return { ok: false, error: fetchErr?.message ?? 'Entry not found' }
  }

  if (entry.status === 'billed') {
    return { ok: false, error: 'Already billed' }
  }

  // Load user's Stripe customer ID
  const { data: profile } = await admin
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', entry.user_id)
    .single()

  if (!profile?.stripe_customer_id) {
    await admin
      .from('overage_ledger')
      .update({ status: 'error', error_message: 'No Stripe customer ID', updated_at: new Date().toISOString() })
      .eq('id', ledgerId)
    return { ok: false, error: 'User has no Stripe customer ID' }
  }

  // Create Stripe Invoice Item (added to next open invoice or creates a new one)
  try {
    const params = new URLSearchParams({
      customer: profile.stripe_customer_id,
      amount: String(Math.round(entry.charge_usd * 100)), // cents
      currency: 'usd',
      description: `AI overage — ${entry.month} (plan: ${entry.plan}, used $${Number(entry.used_usd).toFixed(2)} of $${Number(entry.budget_usd).toFixed(2)} budget)`,
      'metadata[overage_ledger_id]': ledgerId,
      'metadata[month]': entry.month,
      'metadata[plan]': entry.plan,
    })

    const itemRes = await fetch('https://api.stripe.com/v1/invoiceitems', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const item = await itemRes.json()

    if (!itemRes.ok) {
      const errMsg = item?.error?.message ?? 'Stripe API error'
      await admin
        .from('overage_ledger')
        .update({ status: 'error', error_message: errMsg, updated_at: new Date().toISOString() })
        .eq('id', ledgerId)
      return { ok: false, error: errMsg }
    }

    // Mark as billed
    await admin
      .from('overage_ledger')
      .update({
        status: 'billed',
        stripe_invoice_item_id: item.id,
        stripe_invoice_id: item.invoice ?? null,
        billed_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ledgerId)

    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await admin
      .from('overage_ledger')
      .update({ status: 'error', error_message: msg, updated_at: new Date().toISOString() })
      .eq('id', ledgerId)
    return { ok: false, error: msg }
  }
}

/**
 * Waive an overage entry (admin decision — no charge).
 */
export async function waiveOverageEntry(ledgerId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await createAdminClient()
  const { error } = await admin
    .from('overage_ledger')
    .update({ status: 'waived', updated_at: new Date().toISOString() })
    .eq('id', ledgerId)
    .neq('status', 'billed') // can't waive already-billed entries

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
