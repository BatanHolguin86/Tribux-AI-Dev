export function buildFeatureSuggestionsPrompt(
  projectName: string,
  discoveryDocs: string,
): string {
  return `ROL: Eres el CTO Virtual de AI Squad Command Center.

PROYECTO: ${projectName}

DISCOVERY APROBADO:
${discoveryDocs}

TAREA: Sugiere entre 3 y 6 features para el MVP de este producto. Cada feature debe ser una unidad funcional independiente que pueda especificarse con requirements, design y tasks.

INSTRUCCIONES:
- Basa las sugerencias en el discovery aprobado
- Prioriza features core del MVP (no nice-to-haves)
- Ordena por prioridad de implementacion
- Incluye un feature de Auth/Onboarding si aplica
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
