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
  wireframe: `ESTILO VISUAL: Wireframe
- Colores neutros: bg-gray-50, bg-gray-100, bg-white, bordes gray-200/300
- Bordes punteados (border-dashed) para placeholders de imagenes
- Sin sombras pesadas, sin gradientes
- Texto en gray-600/700/900
- Enfocate en ESTRUCTURA y LAYOUT`,
  mockup_lowfi: `ESTILO VISUAL: Mockup Low-Fidelity
- Un color primario (sky-500/600) + escala de grays
- Contenido placeholder realista (nombres, emails, textos)
- Iconos SVG inline simples
- Bordes suaves (rounded-lg), sombras sutiles (shadow-sm)`,
  mockup_highfi: `ESTILO VISUAL: Mockup High-Fidelity
- Paleta de colores completa y profesional
- Sombras, gradientes sutiles, bordes redondeados
- Tipografia refinada con pesos variados
- Iconos detallados SVG inline
- Debe verse como un producto TERMINADO y profesional`,
}

const HTML_DESIGN_PROMPT = `ROL: Eres un disenador UI/UX experto. Tu tarea es generar disenos VISUALES como HTML renderizable.

REGLA ABSOLUTA: Tu respuesta debe ser UNICAMENTE codigo HTML valido.
- NUNCA uses markdown
- NUNCA uses ASCII art
- NUNCA uses bloques de codigo (\`\`\`)
- NUNCA escribas explicaciones fuera del HTML
- La primera linea de tu respuesta DEBE ser: <!DOCTYPE html>
- La ultima linea DEBE ser: </html>

STACK VISUAL: HTML5 + Tailwind CSS (via CDN) + Google Fonts (Inter).
ENFOQUE: Mobile-first, accesible, profesional.`

export function buildDesignGenerationPrompt(ctx: DesignGenerationContext): string {
  const screensList = ctx.screens.map((s, i) => `${i + 1}. ${s}`).join('\n')

  return `${HTML_DESIGN_PROMPT}

---

PROYECTO: "${ctx.projectName}"

PANTALLAS A DISENAR:
${screensList}

${TYPE_INSTRUCTIONS[ctx.type]}

${ctx.refinement ? `INSTRUCCIONES ADICIONALES DEL USUARIO:\n${ctx.refinement}\n` : ''}
${ctx.discoveryDocs ? `CONTEXTO DEL PROYECTO:\n${ctx.discoveryDocs.slice(0, 4000)}\n` : ''}
${ctx.featureSpecs ? `SPECS DE FEATURES:\n${ctx.featureSpecs.slice(0, 4000)}\n` : ''}

GENERA el HTML con esta estructura exacta:

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>* { font-family: 'Inter', sans-serif; }</style>
  <title>${ctx.projectName} — Disenos</title>
</head>
<body class="bg-gray-50">
  <!-- Para CADA pantalla, una <section> con:
       - Header con nombre de la pantalla
       - El diseno visual completo con componentes reales
       - Contenido placeholder REALISTA
       - Todos los estados relevantes (default, error, success, empty)
  -->
</body>
</html>

IMPORTANTE:
- Usa contenido REALISTA (no "Lorem ipsum"): nombres como "Maria Garcia", emails como "maria@email.com"
- Cada pantalla en una <section class="max-w-sm mx-auto mb-12 bg-white rounded-2xl shadow-lg overflow-hidden">
- Incluye navegacion, formularios, botones, cards — elementos REALES de UI
- Los iconos deben ser SVG inline simples (flechas, check, user, etc.)
- Disena para mobile (375px) como layout principal`
}

type DesignRefineContext = {
  projectName: string
  existingContent: string
  instruction: string
}

export function buildDesignRefinePrompt(ctx: DesignRefineContext): string {
  return `${HTML_DESIGN_PROMPT}

---

TAREA: Refina el diseno HTML del proyecto "${ctx.projectName}".

DISENO HTML ACTUAL:
${ctx.existingContent}

CAMBIOS PEDIDOS POR EL USUARIO:
${ctx.instruction}

Genera el HTML COMPLETO actualizado con los cambios aplicados.
Tu respuesta debe empezar con <!DOCTYPE html> y terminar con </html>.
No incluyas explicaciones — solo el HTML.`
}
