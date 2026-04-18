'server-only'

import { createAdminClient } from '@/lib/supabase/server'

export type QuotaStatus = 'ok' | 'warning' | 'exceeded' | 'whale'

import { CREDIT_PACKS } from './credit-packs'
export { CREDIT_PACKS }
export type { CreditPack } from './credit-packs'

export type QuotaResult = {
  allowed: boolean
  usedUsd: number
  budgetUsd: number
  creditsUsd: number
  effectiveBudgetUsd: number
  usedPct: number
  status: QuotaStatus
  plan: string
  message: string
  canTopUp: boolean
}

/**
 * Returns the current quota status for a user.
 * Fetches: current month AI spend + plan budget from plan_cost_targets.
 */
export async function getUserQuota(userId: string): Promise<QuotaResult> {
  const admin = await createAdminClient()

  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthStart = `${monthStr}-01`
  const nextMonth = new Date(monthStart)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const monthEnd = nextMonth.toISOString().slice(0, 10)

  const [profileRes, usageRes, creditsRes] = await Promise.all([
    admin.from('user_profiles').select('plan').eq('id', userId).single(),
    admin
      .from('ai_usage_events')
      .select('estimated_cost_usd')
      .eq('user_id', userId)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd),
    admin
      .from('credit_purchases')
      .select('amount_usd')
      .eq('user_id', userId)
      .eq('month', monthStr)
      .eq('status', 'completed'),
  ])

  const plan = profileRes.data?.plan ?? 'starter'
  const usedUsd = (usageRes.data ?? []).reduce(
    (sum, e) => sum + Number(e.estimated_cost_usd ?? 0),
    0,
  )
  const creditsUsd = (creditsRes.data ?? []).reduce(
    (sum, e) => sum + Number(e.amount_usd ?? 0),
    0,
  )

  const { data: target } = await admin
    .from('plan_cost_targets')
    .select('monthly_ai_budget_usd')
    .eq('plan', plan)
    .single()

  // Fallback budget if table not seeded yet
  const FALLBACK: Record<string, number> = {
    starter: 14.70, builder: 44.70, pro: 89.70, agency: 209.70, enterprise: 500,
  }
  const baseBudgetUsd = Number(target?.monthly_ai_budget_usd ?? FALLBACK[plan] ?? 44.7)
  const effectiveBudgetUsd = baseBudgetUsd + creditsUsd
  const usedPct = effectiveBudgetUsd > 0 ? Math.round((usedUsd / effectiveBudgetUsd) * 100) : 0

  let status: QuotaStatus
  let allowed: boolean
  let message: string

  if (usedPct >= 150) {
    status = 'whale'
    allowed = false
    message = `Consumiste el ${usedPct}% de tu presupuesto mensual de IA. Compra creditos adicionales para continuar.`
  } else if (usedPct >= 100) {
    status = 'exceeded'
    allowed = false
    message = `Alcanzaste tu limite mensual de IA (${formatUsd(effectiveBudgetUsd)}). Compra creditos para seguir construyendo.`
  } else if (usedPct >= 80) {
    status = 'warning'
    allowed = true
    message = `Usaste el ${usedPct}% de tu presupuesto mensual de IA (${formatUsd(usedUsd)} de ${formatUsd(effectiveBudgetUsd)}).`
  } else {
    status = 'ok'
    allowed = true
    message = ''
  }

  // Fire-and-forget alert for exceeded / whale (deduped by month in DB)
  if (status === 'exceeded' || status === 'whale') {
    void sendQuotaAlert(userId, plan, usedUsd, effectiveBudgetUsd, usedPct, status, monthStr, admin)
  }

  return {
    allowed,
    usedUsd: Math.round(usedUsd * 10000) / 10000,
    budgetUsd: baseBudgetUsd,
    creditsUsd,
    effectiveBudgetUsd,
    usedPct,
    status,
    plan,
    message,
    canTopUp: !allowed && plan !== 'enterprise',
  }
}

/**
 * Call at the top of heavy AI action routes (auto-build, generate-task-code, scaffold, etc.)
 * Returns a 402 Response if quota is exceeded, null if the request can proceed.
 */
export async function checkHeavyQuota(userId: string): Promise<Response | null> {
  const quota = await getUserQuota(userId)
  if (!quota.allowed) {
    return Response.json(
      {
        error: 'quota_exceeded',
        message: quota.message,
        usedPct: quota.usedPct,
        budgetUsd: quota.effectiveBudgetUsd,
        status: quota.status,
        canTopUp: quota.canTopUp,
        creditPacks: quota.canTopUp ? CREDIT_PACKS : [],
        topUpUrl: '/api/billing/top-up',
        upgradeUrl: '/settings?upgrade=true',
      },
      { status: 402 },
    )
  }
  return null
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatUsd(v: number): string {
  return `$${v.toFixed(2)}`
}

async function sendQuotaAlert(
  userId: string,
  plan: string,
  usedUsd: number,
  budgetUsd: number,
  usedPct: number,
  status: QuotaStatus,
  month: string,
  admin: Awaited<ReturnType<typeof createAdminClient>>,
): Promise<void> {
  try {
    const alertType = status === 'whale' ? 'whale_150' : 'exceeded_100'

    // Insert only if not already alerted this month (UNIQUE constraint)
    const { error } = await admin.from('quota_alerts').insert({
      user_id: userId,
      alert_type: alertType,
      plan,
      used_usd: usedUsd,
      budget_usd: budgetUsd,
      used_pct: usedPct,
      month,
    })

    // error.code = '23505' means duplicate — already alerted this month, skip email
    if (error) return

    // Send email to admin if Resend + admin email are configured
    const resendKey = process.env.RESEND_API_KEY
    const adminEmail = process.env.ADMIN_ALERT_EMAIL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tribux-ai.vercel.app'
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'alerts@tribux.dev'

    if (!resendKey || !adminEmail) return

    const isWhale = status === 'whale'
    const subject = isWhale
      ? `🐋 WHALE ALERT — Usuario ${userId.slice(0, 8)} (plan ${plan}) consumió ${usedPct}%`
      : `⚠️ Quota excedida — Usuario ${userId.slice(0, 8)} (plan ${plan}) ${usedPct}%`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Tribux AI Alerts <${fromEmail}>`,
        to: adminEmail,
        subject,
        html: `
          <h2>${isWhale ? '🐋 Whale Alert' : '⚠️ Quota Excedida'}</h2>
          <table>
            <tr><td><b>Usuario</b></td><td>${userId}</td></tr>
            <tr><td><b>Plan</b></td><td>${plan}</td></tr>
            <tr><td><b>Mes</b></td><td>${month}</td></tr>
            <tr><td><b>Gasto actual</b></td><td>${formatUsd(usedUsd)}</td></tr>
            <tr><td><b>Presupuesto</b></td><td>${formatUsd(budgetUsd)}</td></tr>
            <tr><td><b>% del presupuesto</b></td><td><b>${usedPct}%</b></td></tr>
          </table>
          <br/>
          <a href="${appUrl}/admin/finance/users/${userId}">Ver detalle en Admin →</a>
        `,
      }),
    })
  } catch {
    // Never throw — alerts are non-critical
  }
}
