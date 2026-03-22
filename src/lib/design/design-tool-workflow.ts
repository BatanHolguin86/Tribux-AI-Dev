import type { DesignWorkflowContext } from '@/lib/ai/context-builder'

export type DesignToolFlowUi = {
  ctoAlignment: string
  uxDeliverable: string
  steps: readonly string[]
}

const DEFAULT_CUSTOM_FLOW: DesignToolFlowUi = {
  ctoAlignment:
    'Asegura que lo pedido refuerce la propuesta de valor y sirva a las personas del Discovery, sin desviarse a especificacion de implementacion infinita.',
  uxDeliverable: 'Respuesta estructurada en markdown con el artefacto visual/UX solicitado y criterios de revision.',
  steps: [
    'Anclar la peticion en persona(s) y valor del producto.',
    'Proponer 1-2 opciones de enfoque y elegir con el usuario.',
    'Entregar el artefacto con checklist de revision (accesibilidad, responsive si aplica).',
  ],
}

const FLOWS: Record<string, DesignToolFlowUi> = {
  wireframes: {
    ctoAlignment:
      'Validar que cada pantalla refleja la propuesta de valor y los jobs-to-be-done de las personas del Discovery; priorizar claridad sobre densidad tecnica.',
    uxDeliverable:
      'Wireframes ASCII (mobile + desktop cuando aplique), anotaciones de jerarquia, estados clave y enlaces a pantallas del spec KIRO.',
    steps: [
      'Revisar contexto de producto, personas y value proposition.',
      'Listar pantallas/flujos del spec y priorizar por impacto al valor.',
      'Entregar wireframes + notas de usabilidad y responsive.',
    ],
  },
  'component-library': {
    ctoAlignment:
      'La libreria debe ser coherente con el tono del producto y las necesidades de las personas (no solo estetica): componentes que reducen friccion en los flujos criticos.',
    uxDeliverable:
      'Inventario de componentes (nombre, props, variantes, Tailwind/shadcn), tokens que los atraviesan y reglas de uso.',
    steps: [
      'Extraer patrones UI recurrentes del Discovery y de pantallas ya especificadas.',
      'Definir base (Button, Input, Card, etc.) y variantes semanticas.',
      'Documentar accesibilidad minima (focus, labels, contrastes).',
    ],
  },
  'style-guide': {
    ctoAlignment:
      'Colores, tipografia y espaciado deben comunicar confianza y claridad alineados al posicionamiento (industria + value prop), no solo preferencias.',
    uxDeliverable:
      'Guia con paleta, tipografia, espaciado, radios, sombras, motion y modo oscuro; mapeo a tokens Tailwind/CSS variables.',
    steps: [
      'Derivar direccion visual desde value proposition y competencia (si existe en Discovery).',
      'Fijar tokens core y semantica (success/warning/error).',
      'Entregar tabla de uso (donde aplicar cada token).',
    ],
  },
  'user-flows': {
    ctoAlignment:
      'Los flujos deben cerrar el circulo entre persona, motivacion y resultado de negocio; incluir desvios y errores, no solo happy path.',
    uxDeliverable:
      'Flujos numerados (entry → pasos → decisiones → salidas), happy path + errores, puntos de feedback al usuario.',
    steps: [
      'Identificar actores y objetivos desde personas y value proposition.',
      'Mapear flujo principal del producto y flujos de onboarding/criticos.',
      'Anadir ramas de error y recuperacion.',
    ],
  },
  'responsive-specs': {
    ctoAlignment:
      'El comportamiento responsive debe preservar la tarea principal de cada persona en mobile (no solo escalar layout).',
    uxDeliverable:
      'Por pantalla o plantilla: comportamiento < sm, md, lg; navegacion, grids, que se oculta/muestra, breakpoints criticos.',
    steps: [
      'Listar vistas prioritarias segun valor para el usuario.',
      'Definir stack mobile-first y puntos de quiebre.',
      'Entregar tabla responsive + notas de touch targets.',
    ],
  },
  custom: DEFAULT_CUSTOM_FLOW,
}

export function getDesignToolFlowForUi(templateId: string): DesignToolFlowUi {
  return FLOWS[templateId] ?? FLOWS.custom
}

/**
 * Primer mensaje al UI/UX Designer: enmarca CTO + flujo y adjunta contexto Discovery.
 */
export function buildDesignToolInitialUserMessage(
  ctx: DesignWorkflowContext,
  templateId: string,
  templateTitle: string,
  basePrompt: string,
): string {
  const flow = getDesignToolFlowForUi(templateId)

  const contextBlock = [
    '### Contexto de producto (obligatorio — mantenlo presente en todo el artefacto)',
    `- **Proyecto:** ${ctx.projectName}`,
    ctx.industry ? `- **Industria:** ${ctx.industry}` : null,
    ctx.description ? `- **Descripcion:** ${ctx.description}` : null,
    ctx.businessPersona
      ? `- **Perfil de usuario del negocio (user_profiles.persona):** ${ctx.businessPersona}`
      : '- **Perfil de usuario del negocio:** (no definido en perfil — infiere con cuidado desde Discovery)',
    ctx.discoveryPersonas
      ? `- **Personas (Discovery aprobado):**\n${ctx.discoveryPersonas}`
      : '- **Personas (Discovery):** (no hay seccion aprobada — indica el supuesto explicitamente)',
    ctx.valueProposition
      ? `- **Propuesta de valor (Discovery aprobado):**\n${ctx.valueProposition}`
      : '- **Propuesta de valor:** (no hay seccion aprobada — pide al usuario un ancla breve si falta)',
  ]
    .filter(Boolean)
    .join('\n')

  const stepsBlock = flow.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')

  return [
    '## Modo de trabajo: CTO + UI/UX Designer (Design Generator)',
    '',
    `Herramienta activa: **${templateTitle}**.`,
    '',
    '### Alineacion CTO (hazla explicita en 2-4 lineas al inicio de tu respuesta)',
    flow.ctoAlignment,
    '',
    '### Entregable UI/UX',
    flow.uxDeliverable,
    '',
    '### Flujo de uso (refleja este orden en tu respuesta)',
    stepsBlock,
    '',
    contextBlock,
    '',
    '### Instruccion de trabajo (ejecuta ahora)',
    basePrompt,
  ].join('\n')
}

/** Recommended order in UI (value first: screens → visual system → flows → breakpoints). */
export const DESIGN_KIT_TOOL_SEQUENCE = [
  'wireframes',
  'style-guide',
  'component-library',
  'user-flows',
  'responsive-specs',
  'custom',
] as const

export type DesignKitTemplateId = (typeof DESIGN_KIT_TOOL_SEQUENCE)[number]

/** Short line on each tool card — what the user gets (functional clarity). */
export const DESIGN_TOOL_CARD_META: Record<
  string,
  { step: number; outcomeLine: string; durationHint: string }
> = {
  wireframes: {
    step: 1,
    outcomeLine: 'Wireframes ASCII de pantallas + jerarquía y estados',
    durationHint: '~2–5 min',
  },
  'style-guide': {
    step: 2,
    outcomeLine: 'Paleta, tipografía y tokens listos para Tailwind / shadcn',
    durationHint: '~2–5 min',
  },
  'component-library': {
    step: 3,
    outcomeLine: 'Inventario de componentes reutilizables y variantes',
    durationHint: '~3–6 min',
  },
  'user-flows': {
    step: 4,
    outcomeLine: 'Flujos con happy path, errores y puntos de feedback',
    durationHint: '~3–6 min',
  },
  'responsive-specs': {
    step: 5,
    outcomeLine: 'Comportamiento mobile / tablet / desktop por vista',
    durationHint: '~3–5 min',
  },
  custom: {
    step: 6,
    outcomeLine: 'Lo que definas con el agente, anclado a Discovery',
    durationHint: 'Variable',
  },
}

export function getDesignToolCardMeta(templateId: string) {
  return (
    DESIGN_TOOL_CARD_META[templateId] ?? {
      step: 0,
      outcomeLine: 'Respuesta en el chat',
      durationHint: '—',
    }
  )
}

export const DESIGN_KIT_NEXT_STEPS = [
  { id: 'wireframes', label: 'Wireframes de pantallas' },
  { id: 'style-guide', label: 'Style Guide' },
  { id: 'component-library', label: 'Component Library' },
  { id: 'user-flows', label: 'User Flows' },
  { id: 'responsive-specs', label: 'Responsive Specs' },
  { id: 'custom', label: 'Diseño custom (UI/UX)' },
] as const
