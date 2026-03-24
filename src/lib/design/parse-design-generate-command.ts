import type { DesignType } from '@/types/design'

/**
 * Detects Camino A generate intent from UI/UX Designer chat (TASK-020).
 * Format: [GENERAR wireframe] Login, Dashboard, Settings
 * Types: wireframe | mockup_lowfi | mockup_highfi
 */
const COMMAND_RE =
  /^\[GENERAR\s+(wireframe|mockup_lowfi|mockup_highfi)\]\s*([\s\S]+)$/i

export type ParsedDesignGenerateCommand = {
  type: DesignType
  screens: string[]
}

export function parseDesignGenerateCommand(text: string): ParsedDesignGenerateCommand | null {
  const trimmed = text.trim()
  const m = trimmed.match(COMMAND_RE)
  if (!m) return null
  const type = m[1].toLowerCase() as DesignType
  const rest = m[2].replace(/\s+/g, ' ').trim()
  const screens = rest
    .split(/[,;]| y /i)
    .map((s) => s.trim())
    .filter(Boolean)
  if (screens.length === 0) return null
  return { type, screens }
}
