/**
 * Supabase Management API client for executing SQL on user projects.
 * Uses POST https://api.supabase.com/v1/projects/{ref}/database/query
 */

type SqlResult = {
  success: boolean
  rowCount: number
  error?: string
}

export async function executeSqlOnProject(
  projectRef: string,
  accessToken: string,
  sql: string,
): Promise<SqlResult> {
  const url = `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/database/query`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    const text = await res.text()
    let message = `Supabase API error (${res.status})`
    try {
      const json = JSON.parse(text)
      message = json.message ?? json.error ?? message
    } catch {
      if (text) message = text
    }
    return { success: false, rowCount: 0, error: message }
  }

  const data = await res.json()

  // The Management API returns an array of rows on success
  const rowCount = Array.isArray(data) ? data.length : 0

  return { success: true, rowCount }
}

/** SQL patterns that are too dangerous to execute from the app */
const BLOCKED_SQL_PATTERNS = [
  /DROP\s+DATABASE/i,
  /DROP\s+SCHEMA\s+(public|auth|storage|extensions)/i,
  /TRUNCATE\s+(pg_|information_schema|auth\.|storage\.)/i,
  /DROP\s+OWNED/i,
  /ALTER\s+SYSTEM/i,
  /ALTER\s+ROLE/i,
  /CREATE\s+ROLE/i,
  /DROP\s+ROLE/i,
  /ALTER\s+TABLE\s+(auth|storage)\./i,
  /DROP\s+TABLE\s+(auth|storage)\./i,
  /DELETE\s+FROM\s+(auth|storage)\./i,
]

export function validateSqlSafety(sql: string): { safe: boolean; reason?: string } {
  for (const pattern of BLOCKED_SQL_PATTERNS) {
    if (pattern.test(sql)) {
      return { safe: false, reason: `SQL bloqueado: operacion peligrosa detectada (${pattern.source})` }
    }
  }
  return { safe: true }
}
