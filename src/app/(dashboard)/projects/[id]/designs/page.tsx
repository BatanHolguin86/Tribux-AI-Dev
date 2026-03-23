import { redirect } from 'next/navigation'

/**
 * Design Hub has been integrated into Phase 02 (Architecture & Design).
 * Redirect legacy /designs route to Phase 02 workspace.
 */
export default async function DesignsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/projects/${id}/phase/02`)
}
