import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const THUMB_MAX_CONTENT = 4000

function buildThumbSrcdoc(html: string): string {
  const slice = html.slice(0, THUMB_MAX_CONTENT)
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>html,body{margin:0;padding:0;overflow:hidden;background:#f8fafc;}body{transform:scale(0.22);transform-origin:0 0;width:454%;height:454%;}</style></head><body>${slice}</body></html>`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const thumb = new URL(request.url).searchParams.get('thumb') === '1'

  const { data: artifacts, error } = await supabase
    .from('design_artifacts')
    .select(
      thumb
        ? 'id, type, screen_name, flow_name, status, mime_type, source, external_url, created_at, updated_at, content'
        : 'id, type, screen_name, flow_name, status, mime_type, source, external_url, created_at, updated_at',
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Designs list] Error', error)
    return NextResponse.json({ error: 'Error al cargar disenos' }, { status: 500 })
  }

  const rows = artifacts ?? []

  if (!thumb) {
    return NextResponse.json({ artifacts: rows })
  }

  const withThumbs = rows.map((a) => {
    const row = { ...(a as unknown as Record<string, unknown>) }
    const content = row.content
    delete row.content
    const html =
      typeof content === 'string' && content.trim().length > 0 ? buildThumbSrcdoc(content) : null
    return { ...row, thumb_srcdoc: html }
  })

  return NextResponse.json({ artifacts: withThumbs })
}
