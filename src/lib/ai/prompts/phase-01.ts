import type { KiroDocumentType } from '@/types/feature'

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
  { title: string; objective: string; keyQuestions: string[]; outputStructure: string }
> = {
  requirements: {
    title: 'Requirements',
    objective:
      'Definir user stories, acceptance criteria, requisitos no funcionales y alcance del feature.',
    keyQuestions: [
      'Que necesita poder hacer el usuario con este feature?',
      'Cuales son los user stories principales?',
      'Que criterios de aceptacion debe cumplir cada story?',
      'Hay requisitos de performance, seguridad o accesibilidad?',
      'Que NO incluye esta version del feature?',
      'Cuales son los casos borde mas importantes?',
    ],
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

## Out of Scope
- Lista de lo que NO incluye este feature`,
  },
  design: {
    title: 'Design',
    objective:
      'Disenar la solucion tecnica: modelo de datos, API, flujo de UI y decisiones arquitectonicas.',
    keyQuestions: [
      'Que datos necesita almacenar este feature? (tablas, campos, tipos)',
      'Que endpoints de API necesitas? (metodo, path, request/response)',
      'Como se ve la UI? (pantallas, layout, componentes)',
      'Como se conecta con features anteriores? (tablas compartidas, APIs)',
      'Que decisiones arquitectonicas hay que tomar?',
    ],
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
    keyQuestions: [
      'Este documento se genera automaticamente basado en requirements y design aprobados.',
    ],
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

  return `ROL: Eres el CTO Virtual y Orquestador de AI Squad Command Center. Tu tono es profesional pero accesible.

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

DOCUMENTO A GENERAR: ${config.title}
OBJETIVO: ${config.objective}

STACK TECNICO: Next.js 14+ (App Router), TypeScript strict, Supabase (PostgreSQL + Auth + Storage + RLS), Tailwind CSS, shadcn/ui, Vercel AI SDK, Zustand, React Hook Form + Zod.

INSTRUCCIONES:
- Comunicate en espanol (es-LATAM)
- Haz UNA pregunta a la vez
- Usa el discovery aprobado como fundamento — no contradigas lo que ya se definio
- Mantene coherencia con specs de features anteriores (mismas convenciones, mismas tablas base)
- Genera documentos en espanol (excepto codigo y nombres tecnicos en ingles)
- Si el usuario da respuestas vagas, pide elaboracion especifica
${docType === 'tasks' ? '- Para tasks: genera automaticamente basado en requirements y design aprobados, con numeracion TASK-XXX secuencial' : ''}

PREGUNTAS CLAVE:
${config.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

ESTRUCTURA DEL DOCUMENTO:
${config.outputStructure}

IMPORTANTE: Cuando consideres que tienes suficiente informacion, responde con "[SECTION_READY]" al final de tu mensaje.`
}

export function buildKiroDocGenerationPrompt(
  docType: KiroDocumentType,
  context: KiroContext,
): string {
  const config = DOC_CONFIGS[docType]

  return `ROL: Eres el CTO Virtual de AI Squad Command Center. Genera un documento KIRO formal.

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
