import type { KiroDocumentType } from '@/types/feature'
import { CTO_VIRTUAL_PROMPT } from '../agents/cto-virtual'

type KiroContext = {
  projectName: string
  description: string | null
  industry: string | null
  persona: string | null
  discoveryDocs: string
  previousSpecs: string
  featureName: string
  featureDescription: string | null
}

const DOC_CONFIGS: Record<
  KiroDocumentType,
  { title: string; objective: string; approach: string; outputStructure: string }
> = {
  requirements: {
    title: 'Requirements',
    objective:
      'Definir user stories, acceptance criteria, requisitos no funcionales y alcance del feature.',
    approach: `COMO LIDERAR ESTA SECCION:
- Ya tienes el Discovery completo y la descripcion del feature. USA ESO como base: propone user stories basadas en lo que ya sabes del producto, las personas y la propuesta de valor.
- No preguntes "que necesita poder hacer el usuario?" si ya lo sabes del Discovery. En su lugar, presenta tus user stories propuestas y pide al usuario que las valide, ajuste o agregue nuevas.
- Piensa en los acceptance criteria como si fueras el QA: cada criterio debe ser especifico, verificable y no ambiguo.
- Identifica edge cases criticos: que pasa si el usuario no tiene datos? Si se cae la conexion? Si tiene permisos incorrectos?
- Define claramente el "Out of Scope" — esto es TAN importante como definir el alcance. Se firme.
- Si hay specs de features anteriores, asegurate de mantener coherencia (mismas convenciones, mismos patrones).
- Para NFRs piensa en: performance (tiempos de carga), seguridad (auth, RLS), accesibilidad (WCAG 2.1 AA), y escalabilidad.`,
    outputStructure: `# Requirements: {Nombre del Feature}

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
      'Disenar la solucion tecnica: modelo de datos, API, flujo de UI y decisiones arquitectonicas.',
    approach: `COMO LIDERAR ESTA SECCION:
- Ya tienes los requirements aprobados. PROPONE un diseno tecnico basado en el stack del proyecto (Next.js, Supabase, Tailwind).
- Para el modelo de datos, propone las tablas con campos, tipos y constraints. Piensa en RLS desde el inicio.
- Para la API, propone los endpoints (Next.js App Router format: /api/...) con request/response schemas.
- Para la UI, describe los componentes principales y el flujo de usuario. Si es complejo, sugiere al usuario abrir un hilo con el UI/UX Designer para wireframes detallados.
- Documenta decisiones arquitectonicas: por que elegiste cierto patron, que alternativas descartaste.
- Mantene coherencia con features anteriores: reutiliza tablas existentes, sigue convenciones de naming, no dupliques endpoints.
- Piensa en la implementacion: cada pieza del diseno debe ser implementable por el Lead Developer sin ambiguedad.`,
    outputStructure: `# Design: {Nombre del Feature}

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
    approach: `COMO LIDERAR ESTA SECCION:
- Este documento se genera semi-automaticamente basado en requirements y design aprobados.
- Cada task debe ser atomica: un desarrollador debe poder completarla en 1-4 horas.
- Ordena por dependencias: primero setup/DB, luego backend/API, luego frontend, luego tests.
- Numeracion secuencial: TASK-001, TASK-002, etc.
- Incluye tasks de testing desde el principio (no como afterthought).
- Si el feature requiere migraciones de DB, incluye tanto la migracion como el rollback.`,
    outputStructure: `# Tasks: {Nombre del Feature}

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

COHERENCIA: Usa el Discovery aprobado como fundamento — no contradigas lo que ya se definio. Si hay specs de features anteriores, mantene las mismas convenciones, tablas base y patrones.

ESTRUCTURA DEL DOCUMENTO:
${config.outputStructure}

REGLA CRITICA: Cuando tengas suficiente informacion para generar el documento, responde con "[SECTION_READY]" al final de tu mensaje. Resume lo que vas a documentar y pregunta si quiere ajustar algo antes de generar.`
}

export function buildKiroDocGenerationPrompt(
  docType: KiroDocumentType,
  context: KiroContext,
): string {
  const config = DOC_CONFIGS[docType]

  return `ROL: Eres el CTO Virtual de AI Squad. Genera un documento KIRO formal basado en la conversacion.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.projectName}
- Industria: ${context.industry || 'No especificada'}

DISCOVERY: ${context.discoveryDocs || 'No disponible'}
SPECS PREVIOS: ${context.previousSpecs || 'Primer feature.'}

FEATURE: ${context.featureName}
DOCUMENTO: ${config.title}

STACK: Next.js 14+, TypeScript strict, Supabase, Tailwind, shadcn/ui.

INSTRUCCIONES:
- Genera en espanol, codigo en ingles
- Se especifico — no uses placeholders
- Sigue la estructura KIRO exacta
- Formato Markdown

ESTRUCTURA:
${config.outputStructure}`
}

export const KIRO_DOC_TYPES: KiroDocumentType[] = ['requirements', 'design', 'tasks']

export const KIRO_DOC_LABELS: Record<KiroDocumentType, string> = {
  requirements: 'Requirements',
  design: 'Design',
  tasks: 'Tasks',
}
