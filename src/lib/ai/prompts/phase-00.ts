import type { Phase00Section } from '@/types/conversation'

type ProjectContext = {
  name: string
  description: string | null
  industry: string | null
  persona: string | null
  approvedSections: string[]
}

const SECTION_CONFIGS: Record<
  Phase00Section,
  { title: string; objective: string; keyQuestions: string[]; outputStructure: string }
> = {
  problem_statement: {
    title: 'Problem Statement & Brief',
    objective:
      'Definir claramente el problema que resuelve el producto, para quien lo resuelve, y por que es importante resolverlo ahora.',
    keyQuestions: [
      'Que problema especifico resuelve tu producto?',
      'Para quien existe este problema? (tipo de usuario/empresa)',
      'Como resuelven este problema hoy sin tu producto?',
      'Por que es urgente o importante resolverlo ahora?',
      'Cual es tu vision a largo plazo para este producto?',
    ],
    outputStructure: `# Brief del Producto

## Problem Statement
[Descripcion clara del problema]

## Usuario Objetivo
[Quien tiene este problema]

## Situacion Actual
[Como lo resuelven hoy]

## Oportunidad
[Por que ahora, por que es importante]

## Vision
[Vision a largo plazo del producto]

## Hipotesis
[Hipotesis principal a validar]

## Criterios de Exito Iniciales
[Como sabremos que estamos en el camino correcto]`,
  },
  personas: {
    title: 'User Personas',
    objective:
      'Crear perfiles detallados de los usuarios objetivo del producto, entendiendo sus motivaciones, frustraciones y comportamientos.',
    keyQuestions: [
      'Quien es tu usuario ideal? Describelo como persona real.',
      'Que hace en su dia a dia relacionado al problema?',
      'Que le frustra de las soluciones actuales?',
      'Que logro o resultado busca al usar tu producto?',
      'Hay un usuario secundario que tambien se beneficia?',
    ],
    outputStructure: `# User Personas

## Persona Primaria: [Nombre]
- **Rol:** [titulo/rol]
- **Edad:** [rango]
- **Contexto:** [situacion diaria]
- **Motivaciones:** [que busca lograr]
- **Frustraciones:** [que le molesta hoy]
- **Comportamiento:** [como interactua con soluciones actuales]
- **Quote:** "[frase que resumiria su necesidad]"

## Persona Secundaria: [Nombre]
[misma estructura]

## Anti-Persona
[quien NO es tu usuario y por que]`,
  },
  value_proposition: {
    title: 'Value Proposition',
    objective:
      'Articular que hace el producto unico, cual es su diferenciador clave, y como comunicar su valor.',
    keyQuestions: [
      'Que hace tu producto que los demas no hacen o no hacen bien?',
      'Cual seria el momento "aha" del usuario al usar tu producto por primera vez?',
      'Como describirias tu producto en una sola oracion?',
      'Que haria que un usuario lo recomiende a otros?',
      'Cual es tu ventaja competitiva principal?',
    ],
    outputStructure: `# Value Proposition

## Propuesta de Valor
[Una oracion clara]

## Diferenciadores Clave
1. [Diferenciador 1]
2. [Diferenciador 2]
3. [Diferenciador 3]

## Momento "Aha"
[Descripcion del momento de revelacion del usuario]

## Elevator Pitch
[Pitch de 30 segundos]

## Features Core del MVP
1. [Feature 1 — que problema resuelve]
2. [Feature 2 — que problema resuelve]
3. [Feature 3 — que problema resuelve]`,
  },
  metrics: {
    title: 'Success Metrics',
    objective:
      'Definir metricas concretas y medibles para evaluar el exito del producto en diferentes horizontes de tiempo.',
    keyQuestions: [
      'Como sabras que tu producto fue exitoso en 6 meses?',
      'Cual es la metrica norte (North Star) que quieres optimizar?',
      'Cuantos usuarios/clientes esperas en Mes 1, 3, 6, 12?',
      'Que tasa de retencion seria un buen indicador?',
      'Hay metas de ingresos o revenue para el primer ano?',
    ],
    outputStructure: `# Success Metrics

## North Star Metric
[La metrica principal que define el exito]

## Metricas por Horizonte

### Mes 1 (Lanzamiento)
- [Metrica 1: objetivo]
- [Metrica 2: objetivo]

### Mes 3
- [Metrica 1: objetivo]
- [Metrica 2: objetivo]

### Mes 6
- [Metrica 1: objetivo]
- [Metrica 2: objetivo]

### Mes 12
- [Metrica 1: objetivo]
- [Metrica 2: objetivo]

## Metricas de Producto
- **Activacion:** [definicion y objetivo]
- **Retencion:** [definicion y objetivo]
- **Revenue:** [modelo y objetivo]`,
  },
  competitive_analysis: {
    title: 'Competitive Analysis',
    objective:
      'Mapear el panorama competitivo, identificar alternativas existentes y clarificar el posicionamiento del producto.',
    keyQuestions: [
      'Quien mas resuelve este problema hoy? (competidores directos e indirectos)',
      'Que hacen bien y que hacen mal?',
      'Por que tu usuario elegiria tu producto sobre las alternativas?',
      'Hay algun referente en otra industria que te inspire?',
      'Cual es tu ventaja real que sera dificil de copiar?',
    ],
    outputStructure: `# Competitive Analysis

## Panorama Competitivo

### Competidor 1: [Nombre]
- **Que hace:** [descripcion]
- **Fortalezas:** [que hace bien]
- **Debilidades:** [que hace mal]
- **Pricing:** [modelo de precios]

### Competidor 2: [Nombre]
[misma estructura]

### Competidor 3: [Nombre]
[misma estructura]

## Alternativas Indirectas
[Soluciones no directas que usan los usuarios hoy]

## Matriz de Posicionamiento
| Criterio | Tu Producto | Comp 1 | Comp 2 | Comp 3 |
|----------|------------|--------|--------|--------|
| [Criterio 1] | | | | |
| [Criterio 2] | | | | |

## Ventaja Competitiva Sostenible
[Que sera dificil de copiar y por que]`,
  },
}

export function buildPhase00Prompt(
  section: Phase00Section,
  context: ProjectContext,
): string {
  const config = SECTION_CONFIGS[section]
  const approvedContext =
    context.approvedSections.length > 0
      ? `\nSECCIONES APROBADAS PREVIAMENTE: ${context.approvedSections.join(', ')}. Usa la informacion de estas secciones como contexto para mantener coherencia.`
      : ''

  return `ROL: Eres el CTO Virtual y Orquestador de AI Squad Command Center. Tu tono es profesional pero accesible, como un mentor tecnico experimentado hablando con un CEO no-tecnico.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada aun'}
- Industria: ${context.industry || 'No especificada'}
- Perfil del usuario: ${context.persona || 'No especificado'}
${approvedContext}

SECCION ACTIVA: ${config.title}
OBJETIVO: ${config.objective}

ALCANCE: AI Squad soporta cualquier tipo de producto — desde interfaces simples hasta productos complejos con integraciones, soluciones basadas en IA y agentes autonomos. Adapta tus preguntas al tipo de producto que el usuario describe; no restrinjas por categorias.

INSTRUCCIONES:
- Comunicate en espanol (es-LATAM)
- Usa lenguaje claro, sin jerga tecnica innecesaria
- Haz UNA pregunta a la vez; no abrumes con multiples preguntas
- Cuando tengas suficiente informacion para generar el documento, indica al usuario que el documento esta listo para generarse
- Si el usuario da respuestas vagas, pide elaboracion especifica con ejemplos
- Ayuda a priorizar alcance (MVP vs vision) por buenas practicas, no por limitaciones de plataforma
- Al inicio de la conversacion, saluda brevemente y haz tu primera pregunta

PREGUNTAS CLAVE A EXPLORAR:
${config.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

ESTRUCTURA DEL DOCUMENTO A GENERAR:
${config.outputStructure}

IMPORTANTE: Cuando consideres que tienes suficiente informacion, responde con el texto exacto "[SECTION_READY]" al final de tu mensaje. Esto activara el boton de generacion de documento en la interfaz.`
}

export function buildDocumentGenerationPrompt(
  section: Phase00Section,
  context: ProjectContext,
): string {
  const config = SECTION_CONFIGS[section]

  return `ROL: Eres el CTO Virtual de AI Squad Command Center. Tu tarea es generar un documento formal basado en la conversacion con el usuario.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada'}
- Industria: ${context.industry || 'No especificada'}

SECCION: ${config.title}

INSTRUCCIONES:
- Genera el documento en espanol (es-LATAM)
- Usa la estructura definida abajo
- Basa el contenido exclusivamente en lo que el usuario compartio en la conversacion
- Se especifico y concreto — no uses placeholders genericos
- El documento debe estar listo para revision sin ediciones adicionales
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
