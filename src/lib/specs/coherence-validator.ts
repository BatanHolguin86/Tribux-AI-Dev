/**
 * Validates coherence between KIRO specs (design.md, requirements.md) across features.
 * Detects: duplicate/similar table names, naming convention violations (snake_case, plural).
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

function normalizeForSimilarity(name: string): string {
  return name.replace(/_/g, '').toLowerCase()
}

export function validateDesignCoherence(
  currentContent: string,
  previousSpecsContent: string,
): CoherenceIssue[] {
  const issues: CoherenceIssue[] = []
  const currentTables = extractTableNames(currentContent, false)
  const previousTables = extractTableNames(previousSpecsContent, true)

  for (const table of currentTables) {
    if (!SNAKE_CASE.test(table)) {
      issues.push({
        type: 'naming_convention',
        message: `La tabla "${table}" no sigue snake_case.`,
        suggestion: 'Usa solo minúsculas y guiones bajos, ej: user_profiles.',
        location: table,
      })
    }
    const lastPart = table.split('_').pop() ?? ''
    if (lastPart.length > 2 && !lastPart.endsWith('s') && !['auth', 'config', 'metadata'].includes(lastPart)) {
      issues.push({
        type: 'naming_convention',
        message: `La tabla "${table}" podría estar en plural (convención del proyecto).`,
        suggestion: `Ej: user_profiles, project_tasks.`,
        location: table,
      })
    }
    const norm = normalizeForSimilarity(table)
    for (const prev of previousTables) {
      const prevNorm = normalizeForSimilarity(prev.toLowerCase())
      if (norm !== prevNorm && (norm.includes(prevNorm) || prevNorm.includes(norm))) {
        issues.push({
          type: 'duplicate_table',
          message: `Posible duplicado: "${table}" vs "${prev}" en specs anteriores.`,
          suggestion: 'Usa el mismo nombre de tabla en todo el proyecto para evitar inconsistencia.',
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
