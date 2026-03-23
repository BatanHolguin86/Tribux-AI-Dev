/**
 * Validates coherence between KIRO specs (design.md, requirements.md) across features.
 * Detects: duplicate/similar table names, naming convention violations (snake_case).
 */

export type CoherenceIssue = {
  type: 'duplicate_table' | 'naming_convention' | 'reference_missing'
  message: string
  suggestion: string
  location?: string
}

const SNAKE_CASE = /^[a-z][a-z0-9_]*(_[a-z0-9]+)*$/
const TABLE_NAME_IN_SQL = /create\s+table\s+(?:if\s+not\s+exists\s+)?[`"]?(\w+)[`"]?/gi
const TABLE_IN_BACKTICKS = /`([a-z_][a-z0-9_]*)`/g

function extractTableNames(content: string, normalizeCase = false): string[] {
  const names = new Set<string>()
  let m: RegExpExecArray | null
  const sqlRegex = new RegExp(TABLE_NAME_IN_SQL.source, 'gi')
  while ((m = sqlRegex.exec(content)) !== null) {
    names.add(normalizeCase ? m[1].toLowerCase() : m[1])
  }
  const backtickRegex = new RegExp(TABLE_IN_BACKTICKS.source, 'g')
  while ((m = backtickRegex.exec(content)) !== null) {
    const name = m[1]
    if (name.length > 2) names.add(normalizeCase ? name.toLowerCase() : name)
  }
  return Array.from(names)
}

export function validateDesignCoherence(
  currentContent: string,
  previousSpecsContent: string,
): CoherenceIssue[] {
  const issues: CoherenceIssue[] = []
  const currentTables = extractTableNames(currentContent, false)
  const previousTables = extractTableNames(previousSpecsContent, true)

  for (const table of currentTables) {
    // Only flag clear snake_case violations (camelCase, PascalCase, spaces)
    if (!SNAKE_CASE.test(table)) {
      issues.push({
        type: 'naming_convention',
        message: `La tabla "${table}" no sigue snake_case.`,
        suggestion: 'Usa solo minúsculas y guiones bajos, ej: user_profiles.',
        location: table,
      })
    }

    // Only flag exact duplicate table names across specs (not substring similarity)
    const norm = table.toLowerCase()
    for (const prev of previousTables) {
      if (norm === prev.toLowerCase()) {
        issues.push({
          type: 'duplicate_table',
          message: `Tabla duplicada: "${table}" ya existe en specs anteriores.`,
          suggestion: 'Reutiliza la tabla existente o usa un nombre diferente.',
          location: table,
        })
      }
    }
  }

  return issues
}

export function validateRequirementsCoherence(
  _currentContent: string,
  _previousSpecsContent: string,
): CoherenceIssue[] {
  return []
}

export function validateSpecCoherence(
  documentType: string,
  currentContent: string,
  previousSpecsContent: string,
): CoherenceIssue[] {
  if (documentType === 'design') {
    return validateDesignCoherence(currentContent, previousSpecsContent)
  }
  if (documentType === 'requirements') {
    return validateRequirementsCoherence(currentContent, previousSpecsContent)
  }
  return []
}
