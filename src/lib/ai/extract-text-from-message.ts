/**
 * Normalizes AI SDK / client message shapes (string content, parts[], content[]) to plain text.
 */
export function extractTextFromMessage(message: unknown): string {
  if (message === null || message === undefined || typeof message !== 'object') {
    return ''
  }

  const m = message as Record<string, unknown>

  if (typeof m.content === 'string') {
    return m.content
  }

  if (Array.isArray(m.parts)) {
    return m.parts
      .filter(
        (p): p is { type: string; text: string } =>
          !!p &&
          typeof p === 'object' &&
          (p as { type?: string }).type === 'text' &&
          typeof (p as { text?: string }).text === 'string',
      )
      .map((p) => p.text)
      .join('')
  }

  if (Array.isArray(m.content)) {
    return m.content
      .filter(
        (p): p is { type: string; text: string } =>
          !!p &&
          typeof p === 'object' &&
          (p as { type?: string }).type === 'text' &&
          typeof (p as { text?: string }).text === 'string',
      )
      .map((p) => p.text)
      .join('')
  }

  if (typeof m.text === 'string') {
    return m.text
  }

  return ''
}
