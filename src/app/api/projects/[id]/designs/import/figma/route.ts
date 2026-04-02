import { createClient } from '@/lib/supabase/server'
import { parseFigmaUrl, exportFigmaFrames, getFigmaEmbedUrl } from '@/lib/integrations/figma'
import { importFigmaSchema } from '@/lib/validations/designs'
import { checkRateLimit, getClientIp, EXTERNAL_IMPORT_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    // Rate limit
    const ip = getClientIp(request)
    const rateResult = checkRateLimit(`import-figma:${user.id}:${ip}`, EXTERNAL_IMPORT_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json({ error: 'rate_limited' }, { status: 429 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, figma_token')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return Response.json({ error: 'not_found' }, { status: 404 })
    if (!project.figma_token) {
      return Response.json({ error: 'no_token', message: 'Configura tu Figma token.' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = importFigmaSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { figma_url, selected_frames, type } = parsed.data
    const figmaParsed = parseFigmaUrl(figma_url)
    if (!figmaParsed) {
      return Response.json({ error: 'invalid_url' }, { status: 400 })
    }

    // Export frames as PNG from Figma
    const nodeIds = selected_frames.map((f) => f.node_id)
    const exports = await exportFigmaFrames(project.figma_token, figmaParsed.fileKey, nodeIds)

    const embedUrl = getFigmaEmbedUrl(figma_url)
    const artifactIds: string[] = []

    for (const exp of exports) {
      const frame = selected_frames.find((f) => f.node_id === exp.node_id)
      const screenName = frame?.name ?? exp.node_id

      // Download the image from Figma CDN
      let imageBuffer: ArrayBuffer | null = null
      try {
        const imgRes = await fetch(exp.image_url)
        if (imgRes.ok) imageBuffer = await imgRes.arrayBuffer()
      } catch { /* non-fatal — artifact created without storage */ }

      // Create artifact record
      const storagePath = `projects/${projectId}/designs/figma-${exp.node_id}.png`

      const { data: artifact, error: insertError } = await supabase
        .from('design_artifacts')
        .insert({
          project_id: projectId,
          type,
          screen_name: screenName,
          storage_path: storagePath,
          mime_type: 'image/png',
          status: 'draft',
          source: 'figma',
          external_url: embedUrl,
          external_id: `${figmaParsed.fileKey}:${exp.node_id}`,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('[figma-import] Insert error:', insertError)
        continue
      }

      // Upload image to storage (best-effort)
      if (imageBuffer && artifact) {
        await supabase.storage
          .from('project-designs')
          .upload(storagePath, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          })
          .catch((err: unknown) => console.error('[figma-import] Storage upload error:', err))
      }

      if (artifact) artifactIds.push(artifact.id)
    }

    return Response.json({ success: true, artifactIds, count: artifactIds.length })
  } catch (error) {
    console.error('[figma-import] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json({ error: 'import_failed', message }, { status: 500 })
  }
}
