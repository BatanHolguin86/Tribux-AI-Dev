import { UI_UX_DESIGNER_PROMPT } from '@/lib/ai/agents/ui-ux-designer'
import type { DesignType } from '@/types/design'

type DesignGenerationContext = {
  projectName: string
  screens: string[]
  type: DesignType
  featureSpecs: string
  discoveryDocs: string
  refinement?: string
}

const TYPE_INSTRUCTIONS: Record<DesignType, string> = {
  wireframe: `ESTILO: Wireframe — usa colores neutros (grays), bordes punteados para placeholders de imagenes,
sin sombras pesadas. Enfocate en estructura y layout. Usa bg-gray-100/200 para areas, border-dashed para imagenes placeholder.`,
  mockup_lowfi: `ESTILO: Mockup Low-Fidelity — agrega contenido placeholder realista (textos, iconos),
usa una paleta de colores limitada (1 color primario + neutrals). Incluye iconos SVG inline simples.`,
  mockup_highfi: `ESTILO: Mockup High-Fidelity — diseno completo con colores de marca, sombras,
bordes redondeados, tipografia refinada, iconos detallados. Debe verse como un producto terminado.`,
}

export function buildDesignGenerationPrompt(ctx: DesignGenerationContext): string {
  const screensList = ctx.screens.map((s, i) => `${i + 1}. ${s}`).join('\n')

  return `${UI_UX_DESIGNER_PROMPT}

---

TAREA DE GENERACION:
Genera wireframes/disenos VISUALES para el proyecto "${ctx.projectName}".

PANTALLAS A DISENAR:
${screensList}

${ctx.refinement ? `INSTRUCCIONES ADICIONALES:\n${ctx.refinement}\n` : ''}
${ctx.discoveryDocs ? `CONTEXTO DEL PROYECTO (Discovery):\n${ctx.discoveryDocs}\n` : ''}
${ctx.featureSpecs ? `SPECS DE FEATURES:\n${ctx.featureSpecs}\n` : ''}

${TYPE_INSTRUCTIONS[ctx.type]}

FORMATO DE RESPUESTA — HTML VISUAL:
Genera UN SOLO documento HTML autocontenido que se pueda renderizar directamente en un iframe.

REGLAS ESTRICTAS:
1. Responde UNICAMENTE con el HTML. Sin markdown, sin explicaciones, sin bloques de codigo. La respuesta completa debe ser HTML valido que empiece con <!DOCTYPE html>.
2. Usa Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Cada pantalla va en una <section> con un header visual que diga el nombre
4. Usa contenido placeholder REALISTA (nombres, emails, textos que parezcan reales)
5. Mobile-first: el diseno principal debe verse bien en 375px de ancho
6. Incluye iconos como SVG inline simples (no dependencias externas)
7. Usa Inter font via Google Fonts
8. Fondo del body: bg-gray-50
9. Cada seccion/pantalla separada visualmente con padding y un divisor
10. Si hay multiples estados (default, error, success, loading), muestralos uno debajo del otro con un label

ESTRUCTURA HTML:
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>* { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 p-4">
  <!-- Pantallas aqui -->
</body>
</html>`
}

type DesignRefineContext = {
  projectName: string
  existingContent: string
  instruction: string
}

export function buildDesignRefinePrompt(ctx: DesignRefineContext): string {
  return `${UI_UX_DESIGNER_PROMPT}

---

TAREA DE REFINAMIENTO:
Refina el siguiente diseno HTML del proyecto "${ctx.projectName}" segun las instrucciones del usuario.

DISENO ACTUAL (HTML):
${ctx.existingContent}

INSTRUCCION DE REFINAMIENTO:
${ctx.instruction}

REGLAS:
1. Responde UNICAMENTE con el HTML completo actualizado. Sin markdown, sin explicaciones, sin bloques de codigo.
2. Mantene la misma estructura (<!DOCTYPE html> con Tailwind CDN)
3. Aplica los cambios pedidos manteniendo consistencia visual
4. La respuesta completa debe ser HTML valido que empiece con <!DOCTYPE html>.`
}
