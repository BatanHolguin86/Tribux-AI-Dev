/**
 * Extracts code files from agent markdown responses.
 * Detects `// filepath: src/...` patterns inside code blocks.
 */

export type ExtractedFile = {
  path: string
  content: string
  language: string
}

/**
 * Extracts files from markdown code blocks that contain filepath annotations.
 *
 * Supported patterns:
 * 1. Comment inside code block:
 *    ```tsx
 *    // filepath: src/components/Button.tsx
 *    export function Button() { ... }
 *    ```
 *
 * 2. SQL comment:
 *    ```sql
 *    -- filepath: infrastructure/supabase/migrations/001_init.sql
 *    CREATE TABLE ...
 *    ```
 *
 * 3. Hash comment (YAML, shell, etc.):
 *    ```yaml
 *    # filepath: .github/workflows/ci.yml
 *    name: CI
 *    ```
 *
 * 4. Bold path before code block:
 *    **src/components/Button.tsx**
 *    ```tsx
 *    export function Button() { ... }
 *    ```
 */
export function extractCodeFiles(markdown: string): ExtractedFile[] {
  const files: ExtractedFile[] = []
  const seen = new Set<string>()

  // Pattern: code blocks with filepath comment on first line
  const codeBlockRegex = /```(\w*)\s*\n([\s\S]*?)```/g
  const filepathCommentRegex = /^(?:\/\/|--|#)\s*filepath:\s*(.+)/i

  // Pattern: bold path immediately before code block
  const boldPathRegex = /\*\*([^\s*]+\.[a-z]{1,10})\*\*\s*\n```(\w*)\s*\n([\s\S]*?)```/g

  // First pass: bold path before code block
  let match: RegExpExecArray | null
  while ((match = boldPathRegex.exec(markdown)) !== null) {
    const filePath = match[1].trim()
    const language = match[2] || inferLanguage(filePath)
    const content = match[3].trim()

    if (filePath && content && !seen.has(filePath)) {
      seen.add(filePath)
      files.push({ path: filePath, content, language })
    }
  }

  // Second pass: filepath comment inside code blocks
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const language = match[1] || ''
    const rawContent = match[2]

    const lines = rawContent.split('\n')
    const firstLine = lines[0]?.trim() ?? ''
    const filepathMatch = firstLine.match(filepathCommentRegex)

    if (filepathMatch) {
      const filePath = filepathMatch[1].trim()
      // Remove the filepath comment line from content
      const content = lines.slice(1).join('\n').trim()

      if (filePath && content && !seen.has(filePath)) {
        seen.add(filePath)
        files.push({
          path: filePath,
          content,
          language: language || inferLanguage(filePath),
        })
      }
    }
  }

  return files
}

function inferLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    sql: 'sql',
    yml: 'yaml',
    yaml: 'yaml',
    json: 'json',
    md: 'markdown',
    css: 'css',
    html: 'html',
    sh: 'bash',
    py: 'python',
    go: 'go',
    rs: 'rust',
  }
  return langMap[ext] ?? ext
}
