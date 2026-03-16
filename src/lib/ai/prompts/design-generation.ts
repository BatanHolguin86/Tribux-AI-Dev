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

const TYPE_LABELS: Record<DesignType, string> = {
  wireframe: 'Wireframe (estructura y layout)',
  mockup_lowfi: 'Mockup Low-Fidelity (layout con contenido placeholder)',
  mockup_highfi: 'Mockup High-Fidelity (diseno detallado con estilos)',
}

export function buildDesignGenerationPrompt(ctx: DesignGenerationContext): string {
  const screensList = ctx.screens.map((s, i) => `${i + 1}. ${s}`).join('\n')

  return `${UI_UX_DESIGNER_PROMPT}

---

TAREA DE GENERACION:
Genera un ${TYPE_LABELS[ctx.type]} para el proyecto "${ctx.projectName}".

PANTALLAS A DISENAR:
${screensList}

${ctx.refinement ? `INSTRUCCIONES ADICIONALES:\n${ctx.refinement}\n` : ''}
${ctx.discoveryDocs ? `CONTEXTO DEL PROYECTO (Discovery):\n${ctx.discoveryDocs}\n` : ''}
${ctx.featureSpecs ? `SPECS DE FEATURES:\n${ctx.featureSpecs}\n` : ''}

FORMATO DE RESPUESTA:
Para cada pantalla, genera:
1. Wireframe en ASCII art con anotaciones detalladas
2. Especificaciones de layout (grid, flex, medidas)
3. Componentes utilizados con props y variants
4. Estados: default, hover, loading, error, empty
5. Especificaciones responsive: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
6. Tailwind CSS classes sugeridas para cada componente

Separa cada pantalla con un header claro: ## Pantalla: {nombre}`
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
Refina el siguiente diseno del proyecto "${ctx.projectName}" segun las instrucciones del usuario.

DISENO ACTUAL:
${ctx.existingContent}

INSTRUCCION DE REFINAMIENTO:
${ctx.instruction}

Genera el diseno actualizado manteniendo el mismo formato. Indica claramente que cambios se realizaron.`
}
