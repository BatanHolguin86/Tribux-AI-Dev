export function buildFeatureSuggestionsPrompt(
  projectName: string,
  discoveryDocs: string,
  previousBacklog?: string,
): string {
  const backlogBlock = previousBacklog
    ? `\nBACKLOG DEL CICLO ANTERIOR (priorizado):
${previousBacklog}

IMPORTANTE: Usa el backlog como punto de partida. Los items de mayor prioridad deben incluirse como features sugeridos.\n`
    : ''

  return `ROL: Eres el CTO Virtual de Tribux AI.

PROYECTO: ${projectName}

DISCOVERY APROBADO:
${discoveryDocs}
${backlogBlock}
TAREA: Sugiere entre 3 y 6 features para ${previousBacklog ? 'el siguiente ciclo' : 'el MVP'} de este producto. Cada feature debe ser una unidad funcional independiente que pueda especificarse con requirements, design y tasks.

INSTRUCCIONES:
- Basa las sugerencias en el discovery aprobado${previousBacklog ? ' y el backlog del ciclo anterior' : ''}
- Prioriza features core ${previousBacklog ? 'pendientes del backlog' : 'del MVP (no nice-to-haves)'}
- Ordena por prioridad de implementacion
- Incluye un feature de Auth/Onboarding si aplica y no existe aun
- Comunicate en espanol

FORMATO DE RESPUESTA (JSON estricto):
{
  "features": [
    {
      "name": "Nombre del Feature",
      "description": "Descripcion breve de que hace y por que es importante",
      "priority": 1
    }
  ]
}

Responde SOLO con el JSON, sin texto adicional.`
}
