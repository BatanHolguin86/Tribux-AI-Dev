import { createClient } from '@/lib/supabase/server'
import { parseFigmaUrl, getFigmaFile } from '@/lib/integrations/figma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: project } = await supabase
      .from('projects')
      .select('id, figma_token')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    if (!project.figma_token) {
      return Response.json(
        { error: 'no_token', message: 'Configura tu Figma token primero.' },
        { status: 400 },
      )
    }

    const { searchParams } = new URL(request.url)
    const figmaUrl = searchParams.get('url')

    if (!figmaUrl) {
      return Response.json({ error: 'missing_url' }, { status: 400 })
    }

    const parsed = parseFigmaUrl(figmaUrl)
    if (!parsed) {
      return Response.json({ error: 'invalid_url', message: 'URL de Figma invalida.' }, { status: 400 })
    }

    const file = await getFigmaFile(project.figma_token, parsed.fileKey)

    return Response.json({
      file_name: file.name,
      frames: file.frames,
    })
  } catch (error) {
    console.error('[figma-frames] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json({ error: 'figma_error', message }, { status: 500 })
  }
}
