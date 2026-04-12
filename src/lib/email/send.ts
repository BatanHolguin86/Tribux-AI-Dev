import { Resend } from 'resend'
import { PHASE_NAMES } from '@/types/project'
import { phaseApprovedEmail, cycleCompleteEmail } from './templates'
import type { SupabaseClient } from '@supabase/supabase-js'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Tribux <noreply@aisquad.dev>'

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) return
  try {
    await resend.emails.send({ from: EMAIL_FROM, to, subject, html })
  } catch (e) {
    console.error('[Email] Failed to send:', e)
  }
}

/**
 * Fire-and-forget notification when a phase is approved.
 * Call WITHOUT await — should never block the response.
 */
export function notifyPhaseApproved(
  supabase: SupabaseClient,
  userEmail: string,
  projectId: string,
  phaseNumber: number,
) {
  if (!resend) return

  // Fire-and-forget async
  void (async () => {
    try {
      const [{ data: profile }, { data: project }] = await Promise.all([
        supabase.from('user_profiles').select('full_name').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '').single(),
        supabase.from('projects').select('name, cycle_number').eq('id', projectId).single(),
      ])

      const userName = profile?.full_name ?? ''
      const projectName = project?.name ?? 'Proyecto'
      const cycleNumber = (project?.cycle_number as number) ?? 1

      const template = phaseNumber === 7
        ? cycleCompleteEmail({ userName, projectName, cycleNumber, projectId })
        : phaseApprovedEmail({ userName, projectName, phaseNumber, projectId })

      await sendEmail(userEmail, template.subject, template.html)
      console.log(`[Email] Phase ${phaseNumber} notification sent to ${userEmail}`)
    } catch (e) {
      console.error('[Email] notifyPhaseApproved failed:', e)
    }
  })()
}
