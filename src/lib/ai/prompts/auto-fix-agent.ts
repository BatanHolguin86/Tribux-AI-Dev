/**
 * Auto-fix agent prompt — analyzes production errors and generates fixes.
 */

export function buildAutoFixPrompt(context: {
  errorMessage: string
  stackTrace?: string
  affectedUrl?: string
  repoStructure?: string
  relatedFiles?: Array<{ path: string; content: string }>
}): string {
  const relatedCode = (context.relatedFiles ?? [])
    .map((f) => `### ${f.path}\n\`\`\`typescript\n${f.content.slice(0, 3000)}\n\`\`\``)
    .join('\n\n')

  return `Eres el Lead Developer de Tribux AI. Se detecto un error en produccion y necesitas generar un fix.

## Error detectado

**Mensaje:** ${context.errorMessage}
${context.stackTrace ? `**Stack trace:**\n\`\`\`\n${context.stackTrace.slice(0, 2000)}\n\`\`\`` : ''}
${context.affectedUrl ? `**URL afectada:** ${context.affectedUrl}` : ''}

## Estructura del repo

${context.repoStructure ?? 'No disponible'}

## Archivos relacionados

${relatedCode || 'No se encontraron archivos relacionados.'}

---

## Tu tarea

1. **Analiza la causa raiz** del error basandote en el stack trace y el codigo
2. **Identifica el archivo y linea** que necesita el fix
3. **Genera el fix** como un diff claro (old_snippet → new_snippet)
4. **Explica el fix** en 2-3 lineas

## Formato de respuesta (JSON)

\`\`\`json
{
  "analysis": "Explicacion de la causa raiz",
  "file": "src/path/to/file.ts",
  "fix": {
    "old_snippet": "codigo original que causa el error",
    "new_snippet": "codigo corregido"
  },
  "commit_message": "fix: descripcion concisa del fix",
  "severity": "critical|high|medium|low",
  "confidence": "high|medium|low"
}
\`\`\`

Responde SOLO JSON valido.`
}
