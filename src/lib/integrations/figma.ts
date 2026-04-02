const FIGMA_API = 'https://api.figma.com'

type FigmaFrame = {
  node_id: string
  name: string
  page: string
}

type FigmaFileInfo = {
  name: string
  frames: FigmaFrame[]
}

type FigmaImageExport = {
  node_id: string
  image_url: string
}

function headers(token: string) {
  return {
    'X-Figma-Token': token,
    Accept: 'application/json',
  }
}

/**
 * Parse a Figma URL to extract file key and optional node ID.
 * Supports:
 *   https://www.figma.com/file/{key}/...
 *   https://www.figma.com/design/{key}/...
 *   ?node-id={nodeId}
 */
export function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('figma.com')) return null

    const match = u.pathname.match(/\/(file|design)\/([a-zA-Z0-9]+)/)
    if (!match) return null

    const fileKey = match[2]
    const nodeId = u.searchParams.get('node-id') ?? undefined

    return { fileKey, nodeId }
  } catch {
    return null
  }
}

/**
 * Fetch Figma file metadata and top-level frames from each page.
 */
export async function getFigmaFile(token: string, fileKey: string): Promise<FigmaFileInfo> {
  const res = await fetch(`${FIGMA_API}/v1/files/${fileKey}?depth=2`, {
    headers: headers(token),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Figma API error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const frames: FigmaFrame[] = []

  for (const page of data.document?.children ?? []) {
    if (page.type !== 'CANVAS') continue
    for (const child of page.children ?? []) {
      if (child.type === 'FRAME' || child.type === 'COMPONENT' || child.type === 'SECTION') {
        frames.push({
          node_id: child.id,
          name: child.name,
          page: page.name,
        })
      }
    }
  }

  return { name: data.name ?? fileKey, frames }
}

/**
 * Export specific frames as PNG images at 2x scale.
 * Returns download URLs (valid for ~14 days from Figma).
 */
export async function exportFigmaFrames(
  token: string,
  fileKey: string,
  nodeIds: string[],
  format: 'png' | 'svg' = 'png',
  scale: number = 2,
): Promise<FigmaImageExport[]> {
  const ids = nodeIds.join(',')
  const res = await fetch(
    `${FIGMA_API}/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`,
    { headers: headers(token) },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Figma export error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const images: Record<string, string | null> = data.images ?? {}

  return nodeIds
    .filter((id) => images[id])
    .map((id) => ({ node_id: id, image_url: images[id]! }))
}

/**
 * Build an embeddable Figma URL for iframe display.
 */
export function getFigmaEmbedUrl(fileUrl: string): string {
  return `https://www.figma.com/embed?embed_host=aisquad&url=${encodeURIComponent(fileUrl)}`
}
