import type { Phase00Section } from '@/types/conversation'
import { CTO_VIRTUAL_PROMPT } from '../agents/cto-virtual'

type ProjectContext = {
  name: string
  description: string | null
  industry: string | null
  persona: string | null
  approvedSections: string[]
}

const SECTION_CONFIGS: Record<
  Phase00Section,
  { title: string; objective: string; approach: string; outputStructure: string }
> = {
  problem_statement: {
    title: 'Problem Statement & Brief',
    objective:
      'Definir claramente el problema que resuelve el producto, para quien lo resuelve, y por que es importante resolverlo ahora.',
    approach: `COMO LIDERAR ESTA SECCION:
- Si el usuario ya describio su idea al crear el proyecto, ANALIZA lo que dijo: identifica el problema implicito, el usuario objetivo, y la oportunidad de mercado. Presenta tu analisis y pide validacion, no repitas las preguntas basicas.
- Si el usuario llega sin contexto, inicia con UNA pregunta potente: "Contame en 2-3 parrafos: que quieres construir, para quien, y que problema les resuelve que hoy no tiene buena solucion."
- Piensa como inversor: busca claridad en el PROBLEMA (no la solucion), el TAMANO del mercado, y la URGENCIA de resolverlo.
- Cuando tengas el problema claro, profundiza en: hipotesis principal, como se resuelve hoy (competencia indirecta), por que AHORA es el momento, y cuales serian los primeros indicadores de exito.
- No hagas preguntas una por una como un formulario. Agrupa 2-3 preguntas relacionadas cuando tenga sentido. Se eficiente.
- Cuando tengas suficiente informacion para generar el brief, resume lo que vas a documentar y pregunta si quiere agregar algo antes de generar.`,
    outputStructure: `# Brief del Producto

## Problem Statement
[Descripcion clara del problema — centrado en el dolor del usuario, no en la solucion]

## Usuario Objetivo
[Quien tiene este problema — perfil demografico, rol, situacion]

## Situacion Actual
[Como lo resuelven hoy — alternativas, workarounds, dolor actual]

## Oportunidad
[Por que ahora — tendencias, cambios de mercado, tecnologia habilitante]

## Vision
[Vision a largo plazo — donde quieres que este el producto en 2-3 anos]

## Hipotesis
[Hipotesis principal a validar con el MVP]

## Criterios de Exito Iniciales
[3-5 metricas concretas para validar la hipotesis en los primeros 3 meses]`,
  },
  personas: {
    title: 'User Personas',
    objective:
      'Crear perfiles detallados de los usuarios objetivo, entendiendo sus motivaciones, frustraciones y comportamientos.',
    approach: `COMO LIDERAR ESTA SECCION:
- Ya tienes el Problem Statement aprobado como contexto. USALO: extrae de ahi quien es el usuario y propone una persona primaria basada en lo que ya sabes.
- Presenta tu propuesta de persona y pide al usuario que la valide/ajuste — no empieces de cero preguntando "quien es tu usuario?"
- Profundiza en: motivaciones reales (Jobs-to-be-Done), frustraciones con las soluciones actuales, contexto diario de uso, y triggers de compra.
- Identifica si hay una persona secundaria relevante (ej: admin, manager, colaborador) y un anti-persona (quien NO deberia usar esto).
- Busca patrones reales: "En que momento del dia/semana usaria esto?" "Que le haria dejar de usarlo?" "Quien le recomendaria el producto?"`,
    outputStructure: `# User Personas

## Persona Primaria: [Nombre]
- **Rol:** [titulo/rol profesional]
- **Edad:** [rango de edad]
- **Contexto:** [situacion diaria, entorno laboral/personal]
- **Jobs-to-be-Done:** [que trabajo intenta completar]
- **Motivaciones:** [que busca lograr, que le importa]
- **Frustraciones:** [que le molesta de las soluciones actuales]
- **Comportamiento digital:** [que herramientas usa, nivel tecnico]
- **Trigger de compra:** [que evento lo llevaria a buscar una solucion]
- **Quote:** "[frase que resumiria su necesidad]"

## Persona Secundaria: [Nombre]
[misma estructura]

## Anti-Persona
[quien NO es tu usuario y por que — esto ayuda a definir alcance]`,
  },
  value_proposition: {
    title: 'Value Proposition',
    objective:
      'Articular que hace el producto unico, cual es su diferenciador clave, y definir el MVP core.',
    approach: `COMO LIDERAR ESTA SECCION:
- Ya tienes Problem Statement y Personas. CONSTRUYE sobre eso: propone una propuesta de valor basada en el problema + la persona principal.
- Usa el framework: "Para [persona] que [problema], [producto] es un [categoria] que [diferenciador]. A diferencia de [alternativas], nuestro producto [ventaja unica]."
- Identifica el momento "aha" — el punto donde el usuario entiende el valor. Esto define el onboarding.
- Define los 3-5 features CORE del MVP — solo lo que valida la hipotesis. Todo lo demas es v2.0. Se firme en limitar el alcance.
- Piensa en monetizacion temprana: como genera valor monetizable este producto?`,
    outputStructure: `# Value Proposition

## Propuesta de Valor
[Una oracion clara usando el framework Para/Que/Es/A diferencia de]

## Diferenciadores Clave
1. [Diferenciador 1 — que no tiene la competencia]
2. [Diferenciador 2]
3. [Diferenciador 3]

## Momento "Aha"
[El momento exacto donde el usuario entiende el valor — esto define el onboarding]

## Elevator Pitch
[30 segundos — problema + solucion + por que tu]

## Features Core del MVP
1. [Feature 1 — que problema resuelve]
2. [Feature 2 — que problema resuelve]
3. [Feature 3 — que problema resuelve]
4. [Feature N — que problema resuelve]

## Explicitamente NO incluido en MVP (v2.0+)
[Lista de features que el usuario podria esperar pero NO van en v1]

## Modelo de Monetizacion
[Como genera ingresos — suscripcion, transaccional, freemium, etc.]`,
  },
  metrics: {
    title: 'Success Metrics',
    objective:
      'Definir metricas concretas y medibles para evaluar el exito del producto en diferentes horizontes.',
    approach: `COMO LIDERAR ESTA SECCION:
- Ya tienes la propuesta de valor y los features del MVP. USA ESO para proponer metricas concretas.
- Define la North Star Metric basada en el core value: si el producto ayuda a ahorrar tiempo, la NSM podria ser "horas ahorradas por usuario/mes". Si genera ingresos, "revenue generado via la plataforma".
- Propone un framework de metricas (AARRR/pirate metrics) adaptado al producto y pide validacion.
- Se realista con las metas: un MVP no va a tener 10,000 usuarios en el mes 1. Propone rangos razonables.
- Incluye metricas de producto (activacion, retencion) y de negocio (CAC, LTV, MRR).`,
    outputStructure: `# Success Metrics

## North Star Metric
[La metrica principal que define el exito del producto — una sola]

## Metricas por Horizonte

### Mes 1 (Lanzamiento)
- [Metrica 1: meta realista]
- [Metrica 2: meta realista]

### Mes 3
- [Metrica 1: meta]
- [Metrica 2: meta]

### Mes 6
- [Metrica 1: meta]
- [Metrica 2: meta]

### Mes 12
- [Metrica 1: meta]
- [Metrica 2: meta]

## Metricas de Producto (AARRR)
- **Adquisicion:** [como llegan los usuarios — canal, meta]
- **Activacion:** [que define un usuario "activado" — evento, meta]
- **Retencion:** [que define un usuario retenido — frecuencia, meta]
- **Revenue:** [modelo de ingresos — meta]
- **Referral:** [como un usuario trae otro — mecanismo, meta]`,
  },
  competitive_analysis: {
    title: 'Competitive Analysis',
    objective:
      'Mapear el panorama competitivo, identificar alternativas existentes y clarificar el posicionamiento del producto.',
    approach: `COMO LIDERAR ESTA SECCION:
- Ya tienes todo el Discovery previo. PROPONE un analisis competitivo basado en lo que sabes del producto y la industria.
- No preguntes "quienes son tus competidores?" — investiga mentalmente basado en el problema y propone: "Para un producto de [X] en [industria], los competidores tipicos serian [A], [B], [C]. Confirmas o hay otros que tengas en mente?"
- Analiza competidores directos (mismo problema, misma solucion), indirectos (mismo problema, diferente solucion) y sustitutos (hojas de calculo, procesos manuales, etc.)
- Identifica la ventaja competitiva SOSTENIBLE — no basta con "mejor UX", necesita ser algo dificil de copiar.
- Mapea brechas de mercado: que NO hace ningun competidor que tu producto SI va a hacer?`,
    outputStructure: `# Competitive Analysis

## Panorama Competitivo

### Competidor Directo 1: [Nombre]
- **Que hace:** [descripcion breve]
- **Fortalezas:** [que hace bien]
- **Debilidades:** [donde falla o no llega]
- **Pricing:** [modelo y rango de precios]
- **Usuarios:** [tamano estimado, perfil]

### Competidor Directo 2: [Nombre]
[misma estructura]

### Competidor Indirecto: [Nombre]
[misma estructura]

## Alternativas Actuales
[Que usan los usuarios HOY: hojas de calculo, procesos manuales, herramientas genericas]

## Matriz de Posicionamiento
| Criterio | Tu Producto | Comp 1 | Comp 2 | Comp 3 |
|----------|------------|--------|--------|--------|
| [Criterio 1] | | | | |
| [Criterio 2] | | | | |
| [Criterio 3] | | | | |

## Brechas de Mercado
[Que necesidad NO cubre ningun competidor — tu oportunidad]

## Ventaja Competitiva Sostenible
[Que sera dificil de copiar: efecto de red, datos propietarios, integraciones profundas, expertise de dominio, etc.]`,
  },
}

export function buildPhase00Prompt(
  section: Phase00Section,
  context: ProjectContext,
): string {
  const config = SECTION_CONFIGS[section]
  const approvedContext =
    context.approvedSections.length > 0
      ? `\n\nSECCIONES YA APROBADAS EN DISCOVERY: ${context.approvedSections.join(', ')}.
Usa toda la informacion de estas secciones como base — NO repitas preguntas sobre temas ya cubiertos. Construye sobre lo que ya se definio.`
      : ''

  return `${CTO_VIRTUAL_PROMPT}

---

FASE ACTIVA: Phase 00 — Discovery & Ideation
SECCION: ${config.title}
OBJETIVO: ${config.objective}

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada aun'}
- Industria: ${context.industry || 'No especificada'}
- Perfil del usuario: ${context.persona || 'No especificado'}
${approvedContext}

${config.approach}

ALCANCE DE LA PLATAFORMA: Tribux AI soporta CUALQUIER tipo de producto — desde apps web simples hasta plataformas SaaS complejas, soluciones con IA, marketplaces, herramientas B2B, etc. Adapta tus preguntas y analisis al tipo de producto que el usuario describe.

ESTRUCTURA DEL DOCUMENTO QUE VAS A GENERAR:
${config.outputStructure}

REGLA CRITICA: Cuando tengas suficiente informacion para generar el documento de esta seccion, responde con el texto exacto "[SECTION_READY]" al final de tu mensaje. Antes de eso, resume brevemente lo que vas a documentar y pregunta si el usuario quiere agregar o ajustar algo.

REGLA DE AVANCE: No invites a "siguiente seccion" o "siguiente fase" hasta que el usuario haya **aprobado** esta seccion en la UI. Si mencionas lo que viene despues, hazlo como "cuando apruebes [esta seccion], podras abrir [siguiente]" — nunca como presion.`
}

export function buildDocumentGenerationPrompt(
  section: Phase00Section,
  context: ProjectContext,
): string {
  const config = SECTION_CONFIGS[section]

  return `ROL: Eres el CTO Virtual de Tribux AI. Tu tarea es generar un documento formal de Discovery basado en la conversacion con el usuario.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada'}
- Industria: ${context.industry || 'No especificada'}

SECCION: ${config.title}

INSTRUCCIONES:
- Genera el documento en espanol (es-LATAM)
- Usa la estructura definida abajo
- Basa el contenido EXCLUSIVAMENTE en lo que el usuario compartio en la conversacion
- Se especifico y concreto — no uses placeholders genericos como "[completar]"
- El documento debe estar listo para revision sin ediciones adicionales
- Si hay informacion que el usuario no proporciono, haz inferencias razonables basadas en el contexto y marcalas con "(inferido — validar)"
- Formato: Markdown

ESTRUCTURA REQUERIDA:
${config.outputStructure}`
}

export const PHASE00_SECTIONS: Phase00Section[] = [
  'problem_statement',
  'personas',
  'value_proposition',
  'metrics',
  'competitive_analysis',
]

export const SECTION_LABELS: Record<Phase00Section, string> = {
  problem_statement: 'Problem Statement',
  personas: 'User Personas',
  value_proposition: 'Value Proposition',
  metrics: 'Success Metrics',
  competitive_analysis: 'Competitive Analysis',
}

export const SECTION_DOC_NAMES: Record<Phase00Section, string> = {
  problem_statement: '01-brief.md',
  personas: '02-personas.md',
  value_proposition: '03-value-proposition.md',
  metrics: '04-metrics.md',
  competitive_analysis: '05-competitive-analysis.md',
}
