import type { KiroDocumentType } from '@/types/feature'
import { CTO_VIRTUAL_PROMPT } from '../agents/cto-virtual'

export type KiroContext = {
  projectName: string
  description: string | null
  industry: string | null
  persona: string | null
  discoveryDocs: string
  previousSpecs: string
  featureName: string
  featureDescription: string | null
}

const RESUMEN_PARA_TI = `- El documento SIEMPRE comienza con una seccion "## Resumen para ti" — 3-4 lineas en lenguaje NO tecnico que expliquen QUE se decidio y POR QUE. Escribe como si le explicas a un fundador no-tecnico que no sabe programar. Ejemplo: "Este feature necesita 4 cosas: registro con email, pantalla de perfil, notificaciones y proteccion de datos. Abajo esta el detalle tecnico."`

const CTO_EFFICIENCY_RULES = `
REGLAS DE EFICIENCIA CTO (APLICA A TODOS LOS DOCUMENTOS):
- NUNCA generes codigo fuente (no imports, no exports, no snippets de implementacion) — esto es solo spec KIRO, no codigo.
- MAXIMO 3 turnos de chat antes de cerrar con [SECTION_READY]. Si en el turno 3 no hay alineacion, toma decisiones razonables y cierra.
- Cada respuesta termina con un estado claro: "Cambie X e Y. Apruebas o ajustamos algo mas?"
- No repitas contexto que ya se dijo. Si el usuario ya valido algo, no lo reiteres.
- CERO menciones de fases futuras (Phase 02, Phase 03, etc.) en tu respuesta.`

const DOC_CONFIGS: Record<
  KiroDocumentType,
  { title: string; objective: string; approach: string; outputStructure: string }
> = {
  requirements: {
    title: 'Requirements',
    objective:
      'Definir user stories, acceptance criteria, requisitos no funcionales y alcance del feature.',
    approach: `MODO AUTO-DRAFT (REQUIREMENTS):
- Este documento se genera AUTOMATICAMENTE. El usuario NO conversa contigo antes: ve el documento generado directamente.
- USA el Discovery completo, la descripcion del feature, y las notas de los especialistas como fuente de verdad.
- Propone 3-8 user stories basadas en las personas y propuesta de valor del Discovery.
- Cada acceptance criterion debe ser especifico, verificable y no ambiguo.
- Identifica edge cases criticos: sin datos, sin conexion, permisos incorrectos, datos invalidos.
- Define "Out of Scope" con firmeza — tan importante como el alcance.
- Si hay specs de features anteriores, mantene coherencia (convenciones, patrones).
- Para NFRs: performance (tiempos de carga), seguridad (auth, RLS), accesibilidad (WCAG 2.1 AA), escalabilidad.
- Si el usuario pide refinamientos via chat despues, responde con los cambios puntuales. Nada de re-explicar todo.`,
    outputStructure: `# Requirements: {Nombre del Feature}

## Resumen para ti
3-4 lineas en lenguaje no-tecnico explicando que cubre este feature y por que.

## User Stories
- Como {rol}, quiero {accion}, para {beneficio}

## Acceptance Criteria
- [ ] Criterio 1 (especifico y verificable)
- [ ] Criterio 2

## Non-Functional Requirements
- Performance: ...
- Security: ...
- Accessibility: ...

## Edge Cases
- [Caso borde 1 y como manejarlo]
- [Caso borde 2 y como manejarlo]

## Out of Scope
- Lista de lo que NO incluye este feature`,
  },
  design: {
    title: 'Design',
    objective:
      'Cerrar el documento KIRO Design del feature: vision tecnica alineada a requirements, sin sustituir Phase 02 ni el backlog de implementacion.',
    approach: `MODO PROPUESTA COMPACTA (DESIGN — 1 TURNO DE ALINEACION):
- En tu PRIMER y UNICO mensaje antes de generar, presenta una propuesta compacta con EXACTAMENTE esta estructura:

**1. Overview** (2-3 lineas): que hace la solucion tecnica.
**2. Modelo de datos**: tablas + campos clave (sin tipos detallados, solo nombres).
**3. APIs**: endpoints listados (metodo + ruta, una linea cada uno).
**4. 2 decisiones arquitectonicas** que necesitan validacion del usuario (trade-offs concretos).

- Cierra con: "Alineado? Confirma y genero el documento completo."
- Si el usuario confirma, responde SOLO con un resumen de 2 lineas de lo que entrara + [SECTION_READY].
- Si el usuario ajusta, incorpora el feedback y cierra con [SECTION_READY] en ese MISMO turno (turno 2 maximo).
- PROHIBIDO en esta pestana: TASK-001/TASK-XXX, checklists de implementacion, sprints, desglose de tareas.
- PROHIBIDO escribir el Markdown completo del documento en el chat — eso va en el documento generado.
- PROHIBIDO generar codigo fuente.
- Coherencia con features anteriores: reutiliza convenciones y tablas ya definidas.`,
    outputStructure: `# Design: {Nombre del Feature}

## Resumen para ti
3-4 lineas en lenguaje no-tecnico explicando la solucion tecnica propuesta.

## Overview
Descripcion de la solucion tecnica propuesta.

## Data Model
Tablas/esquemas afectados con campos y tipos.

## API Design
Endpoints, request/response schemas, auth requerida.

## UI/UX Flow
Descripcion de pantallas y flujo de usuario.

## Architecture Decisions
Decisiones tecnicas clave y su justificacion.

## Dependencies
Librerias, servicios externos, features previas necesarias.`,
  },
  tasks: {
    title: 'Tasks',
    objective:
      'Descomponer el feature en tasks atomicas y accionables basadas en requirements y design aprobados.',
    approach: `MODO AUTO-DRAFT (TASKS):
- Este documento se genera AUTOMATICAMENTE. El usuario NO conversa contigo antes: ve el documento generado directamente.
- Requirements y Design ya estan aprobados: usalos como fuente de verdad. No los repitas en extenso.
- Descompone en tasks atomicas (1-4 horas cada una), ordenadas por dependencias: setup/DB → API → frontend → tests → deploy.
- Numeracion: TASK-001, TASK-002, etc. Incluye tests desde el inicio. Migraciones con rollback si aplica.
- Si el usuario pide refinamientos via chat despues, responde con los cambios puntuales.
- No agregues arquitectura extra — Phase 02 es el lugar para eso.`,
    outputStructure: `# Tasks: {Nombre del Feature}

## Resumen para ti
3-4 lineas en lenguaje no-tecnico: cuantas tareas hay, como estan agrupadas, y cual es la ruta critica.

## Checklist de Implementacion

### Setup
- [ ] TASK-XXX: Descripcion concreta

### Backend
- [ ] TASK-XXX: Crear tabla X en Supabase
- [ ] TASK-XXX: Implementar endpoint POST /api/...

### Frontend
- [ ] TASK-XXX: Crear componente X
- [ ] TASK-XXX: Integrar con endpoint

### Tests
- [ ] TASK-XXX: Tests unitarios
- [ ] TASK-XXX: Test E2E del flujo principal

### Deploy
- [ ] TASK-XXX: Variables de entorno
- [ ] TASK-XXX: Migracion en produccion`,
  },
}

export function buildKiroPrompt(
  docType: KiroDocumentType,
  context: KiroContext,
): string {
  const config = DOC_CONFIGS[docType]

  return `${CTO_VIRTUAL_PROMPT}

---

FASE ACTIVA: Phase 01 — Requirements & Spec (KIRO)
DOCUMENTO: ${config.title}
OBJETIVO: ${config.objective}

CONTEXTO DEL PROYECTO:
- Nombre: ${context.projectName}
- Descripcion: ${context.description || 'No proporcionada'}
- Industria: ${context.industry || 'No especificada'}
- Perfil del usuario: ${context.persona || 'No especificado'}

DISCOVERY APROBADO:
${context.discoveryDocs || 'No disponible'}

SPECS DE FEATURES ANTERIORES:
${context.previousSpecs || 'Este es el primer feature.'}

FEATURE ACTIVO: ${context.featureName}
${context.featureDescription ? `Descripcion: ${context.featureDescription}` : ''}

STACK TECNICO: Next.js 14+ (App Router), TypeScript strict, Supabase (PostgreSQL + Auth + Storage + RLS), Tailwind CSS, shadcn/ui, Vercel AI SDK, Zustand, React Hook Form + Zod.

${config.approach}
${CTO_EFFICIENCY_RULES}

COHERENCIA: Usa el Discovery aprobado como fundamento — no contradigas lo que ya se definio. Si hay specs de features anteriores, mantene las mismas convenciones, tablas base y patrones.

ESTRUCTURA DEL DOCUMENTO:
${config.outputStructure}

REGLA CRITICA: Cuando tengas suficiente informacion para generar el documento, responde con "[SECTION_READY]" al final de tu mensaje. Resume lo que vas a documentar y pregunta si quiere ajustar algo antes de generar.

REGLA DE AVANCE: No saltes al siguiente documento KIRO (Requirements → Design → Tasks) ni a Phase 02 en el discurso hasta que el usuario **aprobe** el documento actual en la UI. Formula siempre como "cuando apruebes este [Requirements/Design], abre la pestaña [siguiente]".`
}

export function buildKiroDocGenerationPrompt(
  docType: KiroDocumentType,
  context: KiroContext,
): string {
  const config = DOC_CONFIGS[docType]

  return `ROL: Eres el CTO Virtual de Tribux. Genera un documento KIRO formal basado en la conversacion.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.projectName}
- Descripcion: ${context.description || 'No proporcionada'}
- Industria: ${context.industry || 'No especificada'}

DISCOVERY: ${context.discoveryDocs || 'No disponible'}
SPECS PREVIOS: ${context.previousSpecs || 'Primer feature.'}

FEATURE: ${context.featureName}
${context.featureDescription ? `Descripcion: ${context.featureDescription}` : ''}
DOCUMENTO: ${config.title}

STACK: Next.js 14+, TypeScript strict, Supabase, Tailwind, shadcn/ui.

INSTRUCCIONES:
- Genera en espanol, codigo en ingles
- Se especifico — no uses placeholders
- Sigue la estructura KIRO exacta
- Formato Markdown
${RESUMEN_PARA_TI}
- NUNCA generes codigo fuente (imports, exports, snippets) — solo spec
${
  docType === 'design'
    ? '- No incluyas checklist TASK-001/TASK-XXX ni plan de implementacion por tareas: eso pertenece al documento Tasks.\n'
    : ''
}${
  docType === 'tasks'
    ? '- Este documento es solo Tasks; no dupliques el Design completo ni una arquitectura extensa.\n'
    : ''
}
ESTRUCTURA:
${config.outputStructure}`
}

/**
 * Prompt for auto-draft mode (Requirements and Tasks).
 * Self-contained: does NOT rely on conversation history.
 * Uses Discovery + previous specs + specialist notes as context.
 */
export function buildKiroAutoDraftPrompt(
  docType: KiroDocumentType,
  context: KiroContext,
  specialistNotes: string,
): string {
  const config = DOC_CONFIGS[docType]

  return `ROL: Eres el CTO Virtual de Tribux. Genera un documento KIRO completo y definitivo SIN conversacion previa.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.projectName}
- Descripcion: ${context.description || 'No proporcionada'}
- Industria: ${context.industry || 'No especificada'}
- Perfil del usuario: ${context.persona || 'No especificado'}

DISCOVERY APROBADO:
${context.discoveryDocs || 'No disponible'}

SPECS PREVIOS:
${context.previousSpecs || 'Primer feature.'}

FEATURE: ${context.featureName}
${context.featureDescription ? `Descripcion: ${context.featureDescription}` : ''}

DOCUMENTO: ${config.title}
OBJETIVO: ${config.objective}

STACK: Next.js 14+, TypeScript strict, Supabase (PostgreSQL + Auth + Storage + RLS), Tailwind CSS, shadcn/ui.

${specialistNotes ? `NOTAS DE ESPECIALISTAS (integra pero no copies textualmente):\n${specialistNotes}\n` : ''}

INSTRUCCIONES CRITICAS:
- Genera el documento COMPLETO, listo para aprobar. No es necesaria conversacion previa.
- Usa el Discovery, las specs anteriores, la descripcion del feature y las notas de los especialistas como fuente de verdad.
- Genera en espanol; codigo y nombres tecnicos en ingles.
- Se especifico — no uses placeholders como "definir despues" o "TBD".
- Formato Markdown.
${RESUMEN_PARA_TI}
- NUNCA generes codigo fuente (imports, exports, snippets de implementacion) — solo spec KIRO.
- Si hay specs de features anteriores, mantene coherencia (convenciones, tablas, patrones).
${
  docType === 'design'
    ? '- No incluyas checklist TASK-001/TASK-XXX ni plan de implementacion — eso es el documento Tasks.\n'
    : ''
}${
  docType === 'tasks'
    ? '- No dupliques el Design completo ni arquitectura extensa — enfocate en descomposicion de trabajo.\n'
    : ''
}
ESTRUCTURA EXACTA A SEGUIR:
${config.outputStructure}`
}

export const KIRO_DOC_TYPES: KiroDocumentType[] = ['requirements', 'design', 'tasks']

export const KIRO_DOC_LABELS: Record<KiroDocumentType, string> = {
  requirements: 'Requirements',
  design: 'Design',
  tasks: 'Tasks',
}
