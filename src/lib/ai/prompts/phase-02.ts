import type { Phase02Section } from '@/types/conversation'
import { CTO_VIRTUAL_PROMPT } from '../agents/cto-virtual'

type ProjectContext = {
  name: string
  description: string | null
  industry: string | null
  persona: string | null
  approvedSections: string[]
  discoveryDocs: string
  featureSpecs: string
  designArtifactsSummary: string
}

const SECTION_CONFIGS: Record<
  Phase02Section,
  { title: string; objective: string; approach: string; outputStructure: string }
> = {
  system_architecture: {
    title: 'System Architecture',
    objective:
      'Definir la arquitectura de alto nivel del sistema: componentes principales, flujo de datos, stack tecnologico y como se conectan las piezas.',
    approach: `COMO LIDERAR ESTA SECCION:
- Ya tienes Discovery + Feature Specs. PROPONE una arquitectura basada en lo que sabes del producto.
- El stack base ya esta definido (Next.js + Supabase + Vercel). No preguntes "que tecnologias quieres usar?" — en su lugar, propone la arquitectura concreta y explica tus decisiones.
- Genera un diagrama ASCII de los componentes principales y el flujo de datos.
- Identifica los puntos de integracion externos (pagos, email, IA, storage, etc.) basados en los features del spec.
- Piensa en escalabilidad desde el diseno: que cambiaria si pasan de 100 a 10,000 usuarios?
- Para decisiones arquitectonicas complejas, sugiere al usuario abrir un hilo con el System Architect para profundizar.
- Modelos de seguridad: define auth flow, autorizacion (roles/permisos), y proteccion de datos sensibles.`,
    outputStructure: `# System Architecture

## Overview
[Descripcion de alto nivel del sistema y su proposito]

## Architecture Diagram
\`\`\`
[Diagrama ASCII mostrando componentes y flujo de datos]
\`\`\`

## Tech Stack
| Capa | Tecnologia | Justificacion |
|------|-----------|---------------|
| Frontend | [tech] | [por que] |
| Backend | [tech] | [por que] |
| Base de datos | [tech] | [por que] |
| Auth | [tech] | [por que] |
| Hosting | [tech] | [por que] |
| Otros | [tech] | [por que] |

## Components
### [Componente 1]
- **Responsabilidad:** [que hace]
- **Tecnologia:** [stack]
- **Conexiones:** [con que otros componentes se comunica]

### [Componente 2]
[misma estructura]

## Data Flow
### Flow 1: [nombre del flujo principal]
\`\`\`
[paso 1] -> [paso 2] -> [paso 3] -> [resultado]
\`\`\`

### Flow 2: [nombre del flujo secundario]
[misma estructura]

## Security Model
- **Autenticacion:** [como se autentica]
- **Autorizacion:** [como se controla acceso]
- **Datos sensibles:** [como se protegen]

## Scalability Considerations
[Estrategia de escalabilidad y limites esperados]`,
  },
  database_design: {
    title: 'Database Design',
    objective:
      'Disenar el modelo de datos del sistema: entidades, relaciones, tablas, campos y estrategia de almacenamiento.',
    approach: `COMO LIDERAR ESTA SECCION:
- Extrae las entidades de los Feature Specs (requirements + design). No preguntes "cuales son tus entidades?" — proponelas TU.
- Genera tablas completas con campos, tipos PostgreSQL, constraints (PK, FK, UNIQUE, NOT NULL), y defaults.
- Disena RLS policies desde el inicio: cada tabla debe tener al menos una policy basica.
- Piensa en indices: que columnas se usan en WHERE y JOIN frecuentemente?
- Incluye columnas de auditoria: created_at, updated_at (con triggers).
- Para modelos de datos complejos, sugiere al usuario abrir un hilo con el DB Admin para optimizar queries y RLS.
- Si el producto necesita almacenar archivos, define la estrategia: Supabase Storage para archivos, DB para metadata.`,
    outputStructure: `# Database Design

## Entity Relationship Diagram
\`\`\`
[Diagrama ASCII mostrando entidades y relaciones]
\`\`\`

## Tables

### [tabla_1]
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Identificador unico |
| [campo] | [tipo] | [restricciones] | [descripcion] |
| created_at | timestamptz | default now() | Fecha de creacion |
| updated_at | timestamptz | default now() | Fecha de actualizacion |

**Relationships:**
- [relacion 1]

**Indexes:**
- [indice 1 y justificacion]

**RLS Policies:**
- [politica 1: quien puede leer/escribir y condicion]

### [tabla_2]
[misma estructura]

## Storage Strategy
- **Base de datos:** [que se almacena en DB]
- **File storage:** [que se almacena en Supabase Storage]
- **Cache:** [estrategia de cache si aplica]

## Migration Plan
[Orden de creacion de tablas y migraciones]`,
  },
  api_design: {
    title: 'API Design',
    objective:
      'Definir los endpoints de la API, contratos request/response, autenticacion requerida y manejo de errores.',
    approach: `COMO LIDERAR ESTA SECCION:
- Extrae los endpoints necesarios de los Feature Specs. PROPONE los endpoints con sus contratos.
- Usa el formato de Next.js App Router: /api/[recurso]/route.ts con GET, POST, PATCH, DELETE.
- Define request/response schemas con tipos TypeScript y validacion Zod.
- Marca claramente cuales endpoints requieren auth y cuales son publicos.
- Piensa en paginacion (cursor-based o offset), filtros, y sorting para endpoints de listado.
- Define el patron de error handling consistente: { error: string, code?: string }.
- Identifica endpoints que necesitan rate limiting y define los limites.
- Para integraciones complejas con APIs externas, sugiere al usuario consultar con el Lead Developer.`,
    outputStructure: `# API Design

## Base URL
\`/api\`

## Authentication
- **Method:** Supabase Auth (JWT)
- **Header:** Cookie-based (SSR) / \`Authorization: Bearer {token}\` (client)
- **Public endpoints:** [lista]

## Endpoints

### [Recurso 1]

#### \`GET /api/[recurso]\`
- **Auth:** Requerida
- **Description:** [que hace]
- **Query params:** \`?page=1&limit=20&filter=value\`
- **Response 200:**
\`\`\`json
{
  "data": [...],
  "pagination": { "page": 1, "total": 100 }
}
\`\`\`

#### \`POST /api/[recurso]\`
- **Auth:** Requerida
- **Request body:**
\`\`\`json
{
  "field1": "string",
  "field2": "number"
}
\`\`\`
- **Response 201:**
\`\`\`json
{
  "id": "uuid",
  "field1": "string"
}
\`\`\`

### [Recurso 2]
[misma estructura]

## Error Handling
| Status Code | Meaning | Response Shape |
|------------|---------|---------------|
| 400 | Bad Request | \`{ "error": "message", "code": "VALIDATION_ERROR" }\` |
| 401 | Unauthorized | \`{ "error": "No autenticado" }\` |
| 403 | Forbidden | \`{ "error": "Sin permisos" }\` |
| 404 | Not Found | \`{ "error": "Recurso no encontrado" }\` |
| 500 | Server Error | \`{ "error": "Error interno" }\` |

## Rate Limiting
[Politica de rate limiting por endpoint]`,
  },
  architecture_decisions: {
    title: 'Architecture Decisions (ADRs)',
    objective:
      'Documentar las decisiones arquitectonicas clave del proyecto con justificacion, alternativas consideradas y consecuencias.',
    approach: `COMO LIDERAR ESTA SECCION:
- Extrae las decisiones arquitectonicas de las secciones anteriores (System Architecture, Database, API).
- PROPONE los ADRs basandote en las decisiones ya tomadas. No preguntes "cual es tu decision mas importante?" — tu YA las identificaste.
- Cada ADR debe tener: contexto, opciones evaluadas (con pros/contras), decision tomada, y consecuencias.
- Incluye ADRs para: stack tecnologico, patron de arquitectura, estrategia de auth, modelo de datos, estrategia de deploy.
- Si hay trade-offs importantes (velocidad vs escalabilidad, costo vs features), documentalos explicitamente.
- Marca deuda tecnica aceptada conscientemente y plan de mitigacion.`,
    outputStructure: `# Architecture Decision Records

## ADR-001: [Titulo de la Decision]

**Status:** Aprobado
**Fecha:** [fecha]
**Contexto:** [situacion que requiere la decision]

### Opciones Consideradas
| Opcion | Pros | Contras |
|--------|------|---------|
| [Opcion A] | [ventajas] | [desventajas] |
| [Opcion B] | [ventajas] | [desventajas] |

### Decision
[Que se decidio y por que]

### Consecuencias
- **Positivas:** [beneficios]
- **Negativas:** [riesgos aceptados]
- **Mitigacion:** [como mitigar los riesgos]

---

## ADR-002: [Titulo]
[misma estructura]

---

## Resumen de Decisiones
| # | Decision | Elegida | Alternativa |
|---|----------|---------|-------------|
| 001 | [decision] | [elegida] | [descartada] |
| 002 | [decision] | [elegida] | [descartada] |`,
  },
}

/**
 * Ties technical architecture sections to Design & UX hub artifacts (single Phase 02 workflow).
 */
export function buildPhase02DesignCorrelationBlock(
  section: Phase02Section,
  designSummary: string,
): string {
  const whenEmpty = `CORRELACION CON DISEÑO & UX (HUB — pestaña Herramientas):
Aun no hay artefactos visuales en este proyecto. Explica con tono didactico que el **mismo Phase 02** incluye el hub **Diseño & UX**: wireframes y mockups que luego alimentaran este contexto y validaran alcance frente a APIs y datos. No presiones a avanzar de fase; invita a generar al menos borradores cuando tenga sentido.`

  if (!designSummary.trim()) {
    return whenEmpty
  }

  const bySection: Record<Phase02Section, string> = {
    system_architecture:
      'Mapea cada pantalla o flujo listado a **limites de sistema** (modulos, bounded contexts) y al flujo de datos entre UI y backend. Si el diseno exige capacidades no contempladas en specs, dilo y propón ajuste.',
    database_design:
      'Deriva **entidades, tablas y campos** a partir de lo que las pantallas muestran, formularios y listados. Incluye datos sensibles visibles en UI y politicas RLS acordes.',
    api_design:
      'Define **endpoints y contratos** (request/response) que las pantallas necesitan: carga inicial, mutaciones, listados, filtros y paginacion si los mockups lo muestran.',
    architecture_decisions:
      'Documenta **ADRs** donde el diseno visual imponga restricciones (latencia, consistencia eventual, tiempo real, estados vacios complejos). Incluye alternativas y trade-offs.',
  }

  const sectionTitle = SECTION_CONFIGS[section].title

  return `ARTEFACTOS DE DISEÑO & UX (hub — referencia visual para esta misma fase)
${designSummary}

INSTRUCCION DE CORRELACION PARA **${sectionTitle}**:
${bySection[section]}

Regla: Manten **coherencia** entre este documento y las pantallas; si hay conflicto con specs o con el diseno, nombralo y propón correccion en el documento adecuado (KIRO, ADR o iteracion en el hub).`
}

export function buildPhase02Prompt(
  section: Phase02Section,
  context: ProjectContext,
): string {
  const config = SECTION_CONFIGS[section]
  const approvedContext =
    context.approvedSections.length > 0
      ? `\nSECCIONES DE ARCHITECTURE YA APROBADAS: ${context.approvedSections.join(', ')}. Construye sobre estas secciones manteniendo coherencia total.`
      : ''

  const discoveryContext = context.discoveryDocs
    ? `\n\nDOCUMENTOS DE DISCOVERY (Phase 00 aprobados):\n${context.discoveryDocs}`
    : ''

  const featureContext = context.featureSpecs
    ? `\n\nSPECS DE FEATURES (Phase 01 — KIRO aprobados):\n${context.featureSpecs}`
    : ''

  const designCorrelation = buildPhase02DesignCorrelationBlock(
    section,
    context.designArtifactsSummary ?? '',
  )

  return `${CTO_VIRTUAL_PROMPT}

---

FASE ACTIVA: Phase 02 — Architecture & Design (un solo flujo: documentacion tecnica en Secciones + entregables visuales en la pestaña **Diseño & UX**)
SECCION: ${config.title}
OBJETIVO: ${config.objective}

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada aun'}
- Industria: ${context.industry || 'No especificada'}
- Perfil del usuario: ${context.persona || 'No especificado'}
${approvedContext}
${discoveryContext}
${featureContext}

${designCorrelation}

${config.approach}

ESTRUCTURA DEL DOCUMENTO A GENERAR:
${config.outputStructure}

REGLA CRITICA: Cuando tengas suficiente informacion para generar el documento, responde con "[SECTION_READY]" al final de tu mensaje. Resume lo que vas a documentar y pregunta si quiere ajustar algo antes de generar.

REGLA DE AVANCE: No invites a Phase 03, 04 u otras fases hasta que las secciones de Phase 02 esten **aprobadas** en la plataforma. Una seccion a la vez; sin presion para "cerrar Architecture ya".`
}

export function buildDocumentGenerationPrompt(
  section: Phase02Section,
  context: ProjectContext,
): string {
  const config = SECTION_CONFIGS[section]

  const discoveryContext = context.discoveryDocs
    ? `\n\nDOCUMENTOS DE DISCOVERY APROBADOS:\n${context.discoveryDocs}`
    : ''

  const featureContext = context.featureSpecs
    ? `\n\nSPECS DE FEATURES APROBADOS:\n${context.featureSpecs}`
    : ''

  const designCorrelation = buildPhase02DesignCorrelationBlock(
    section,
    context.designArtifactsSummary ?? '',
  )

  return `ROL: Eres el CTO Virtual de AI Squad. Genera un documento formal de arquitectura basado en la conversacion.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada'}
- Industria: ${context.industry || 'No especificada'}
${discoveryContext}
${featureContext}

${designCorrelation}

SECCION: ${config.title}

INSTRUCCIONES:
- Genera en espanol (es-LATAM)
- Usa la estructura definida abajo
- Basa el contenido en lo que el usuario compartio + documentos de contexto
- Se especifico y concreto — usa tipos de datos reales, nombres de tablas reales, endpoints reales
- El documento debe estar listo para revision sin ediciones
- Formato: Markdown

ESTRUCTURA REQUERIDA:
${config.outputStructure}`
}

export const PHASE02_SECTIONS: Phase02Section[] = [
  'system_architecture',
  'database_design',
  'api_design',
  'architecture_decisions',
]

export const SECTION_LABELS: Record<Phase02Section, string> = {
  system_architecture: 'System Architecture',
  database_design: 'Database Design',
  api_design: 'API Design',
  architecture_decisions: 'Architecture Decisions',
}

export const SECTION_DOC_NAMES: Record<Phase02Section, string> = {
  system_architecture: '01-system-architecture.md',
  database_design: '02-database-design.md',
  api_design: '03-api-design.md',
  architecture_decisions: '04-architecture-decisions.md',
}
