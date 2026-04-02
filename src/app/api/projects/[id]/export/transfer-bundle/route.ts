import { createClient } from '@/lib/supabase/server'
import { buildTransferBundle } from '@/lib/export/transfer-bundle'

export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const { zip, projectName } = await buildTransferBundle(projectId)

    const buffer = await zip.generateAsync({ type: 'uint8array' })
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${slug}-transfer-bundle.zip"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    console.error('[transfer-bundle] Error:', error)
    return Response.json(
      { error: 'export_failed', message: error instanceof Error ? error.message : 'Error al generar bundle' },
      { status: 500 },
    )
  }
}
