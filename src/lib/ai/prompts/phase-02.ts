import type { Phase02Section } from '@/types/conversation'

type ProjectContext = {
  name: string
  description: string | null
  industry: string | null
  persona: string | null
  approvedSections: string[]
  discoveryDocs: string
  featureSpecs: string
}

const SECTION_CONFIGS: Record<
  Phase02Section,
  { title: string; objective: string; keyQuestions: string[]; outputStructure: string }
> = {
  system_architecture: {
    title: 'System Architecture',
    objective:
      'Definir la arquitectura de alto nivel del sistema: componentes principales, flujo de datos, stack tecnologico y como se conectan las piezas.',
    keyQuestions: [
      'Que tipo de aplicacion es? (web app, API, mobile, SaaS multi-tenant, etc.)',
      'Quienes son los actores del sistema? (usuarios finales, admins, servicios externos)',
      'Que servicios externos necesitas integrar? (pagos, email, auth, IA, storage, etc.)',
      'Cual es el volumen esperado de usuarios y datos? (para decidir escalabilidad)',
      'Necesitas funcionalidad en tiempo real? (chat, notificaciones, dashboards live)',
    ],
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
    keyQuestions: [
      'Cuales son las entidades principales de tu sistema? (usuarios, productos, ordenes, etc.)',
      'Que relaciones existen entre ellas? (1:1, 1:N, N:N)',
      'Que datos necesitas almacenar por cada entidad? (campos clave)',
      'Necesitas almacenar archivos? (imagenes, documentos, videos)',
      'Hay datos que requieren busqueda avanzada o filtros complejos?',
    ],
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
- [relacion 2]

**Indexes:**
- [indice 1 y justificacion]

### [tabla_2]
[misma estructura]

## Storage Strategy
- **Base de datos:** [que se almacena en DB]
- **File storage:** [que se almacena en storage/S3]
- **Cache:** [estrategia de cache si aplica]

## Security (RLS / Access Control)
- [Tabla 1]: [politica de acceso]
- [Tabla 2]: [politica de acceso]

## Migration Plan
[Orden de creacion de tablas y migraciones]`,
  },
  api_design: {
    title: 'API Design',
    objective:
      'Definir los endpoints de la API, contratos request/response, autenticacion requerida y manejo de errores.',
    keyQuestions: [
      'Cuales son las operaciones principales que necesita tu sistema? (CRUD, acciones especiales)',
      'Que endpoints necesitan autenticacion y cuales son publicos?',
      'Hay operaciones que requieren permisos especiales o roles?',
      'Necesitas paginacion, filtros o busqueda en algun endpoint?',
      'Hay integraciones con APIs externas que necesiten webhooks?',
    ],
    outputStructure: `# API Design

## Base URL
\`[base_url]\`

## Authentication
- **Method:** [JWT / API Key / OAuth]
- **Header:** \`Authorization: Bearer {token}\`
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
- **Description:** [que hace]
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

#### \`PATCH /api/[recurso]/:id\`
[misma estructura]

#### \`DELETE /api/[recurso]/:id\`
[misma estructura]

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
[Politica de rate limiting por endpoint]

## Webhooks (si aplica)
[Endpoints de webhook y payloads]`,
  },
  architecture_decisions: {
    title: 'Architecture Decisions (ADRs)',
    objective:
      'Documentar las decisiones arquitectonicas clave del proyecto con justificacion, alternativas consideradas y consecuencias.',
    keyQuestions: [
      'Cual es la decision tecnica mas importante de tu proyecto? (stack, DB, auth, hosting)',
      'Que alternativas consideraste y por que las descartaste?',
      'Hay trade-offs que necesitas hacer consciente? (velocidad vs escalabilidad, costo vs features)',
      'Que dependencias externas tiene tu proyecto? (APIs, servicios, librerias criticas)',
      'Hay decisiones que podrian cambiar en el futuro? (deuda tecnica aceptada)',
    ],
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
| [Opcion C] | [ventajas] | [desventajas] |

### Decision
[Que se decidio y por que]

### Consecuencias
- **Positivas:** [beneficios]
- **Negativas:** [riesgos aceptados]
- **Mitigacion:** [como mitigar los riesgos]

---

## ADR-002: [Titulo de la Decision]
[misma estructura]

---

## ADR-003: [Titulo de la Decision]
[misma estructura]

---

## Resumen de Decisiones
| # | Decision | Tecnologia Elegida | Alternativa Principal |
|---|----------|-------------------|----------------------|
| 001 | [decision] | [elegida] | [descartada] |
| 002 | [decision] | [elegida] | [descartada] |
| 003 | [decision] | [elegida] | [descartada] |`,
  },
}

export function buildPhase02Prompt(
  section: Phase02Section,
  context: ProjectContext,
): string {
  const config = SECTION_CONFIGS[section]
  const approvedContext =
    context.approvedSections.length > 0
      ? `\nSECCIONES DE ARCHITECTURE APROBADAS PREVIAMENTE: ${context.approvedSections.join(', ')}. Usa la informacion de estas secciones como contexto para mantener coherencia.`
      : ''

  const discoveryContext = context.discoveryDocs
    ? `\n\nDOCUMENTOS DE DISCOVERY (Phase 00 aprobados):\n${context.discoveryDocs}`
    : ''

  const featureContext = context.featureSpecs
    ? `\n\nSPECS DE FEATURES (Phase 01 — KIRO aprobados):\n${context.featureSpecs}`
    : ''

  return `ROL: Eres el System Architect de AI Squad Command Center. Tu tono es tecnico pero accesible — explicas decisiones complejas con claridad para que un CEO/CPO no-tecnico pueda entender y aprobar.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada aun'}
- Industria: ${context.industry || 'No especificada'}
- Perfil del usuario: ${context.persona || 'No especificado'}
${approvedContext}
${discoveryContext}
${featureContext}

SECCION ACTIVA: ${config.title}
OBJETIVO: ${config.objective}

INSTRUCCIONES:
- Comunicate en espanol (es-LATAM)
- Usa lenguaje tecnico cuando sea necesario, pero siempre explica brevemente los conceptos
- Basa tus recomendaciones en los documentos de Discovery y los Specs de Features aprobados
- Haz UNA pregunta a la vez; no abrumes con multiples preguntas
- Proporciona recomendaciones concretas basadas en el tipo de proyecto y sus features
- Si el usuario no tiene preferencia tecnica, sugiere el stack mas apropiado con justificacion
- Cuando tengas suficiente informacion para generar el documento, indica al usuario que esta listo
- Si el usuario da respuestas vagas, pide elaboracion especifica con ejemplos

PREGUNTAS CLAVE A EXPLORAR:
${config.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

ESTRUCTURA DEL DOCUMENTO A GENERAR:
${config.outputStructure}

IMPORTANTE: Cuando consideres que tienes suficiente informacion, responde con el texto exacto "[SECTION_READY]" al final de tu mensaje. Esto activara el boton de generacion de documento en la interfaz.`
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

  return `ROL: Eres el System Architect de AI Squad Command Center. Tu tarea es generar un documento formal de arquitectura basado en la conversacion con el usuario.

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada'}
- Industria: ${context.industry || 'No especificada'}
${discoveryContext}
${featureContext}

SECCION: ${config.title}

INSTRUCCIONES:
- Genera el documento en espanol (es-LATAM)
- Usa la estructura definida abajo
- Basa el contenido exclusivamente en lo que el usuario compartio en la conversacion y en los documentos de contexto
- Se especifico y concreto — no uses placeholders genericos
- Incluye detalles tecnicos reales (tipos de datos, nombres de tablas, endpoints reales)
- El documento debe estar listo para revision sin ediciones adicionales
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
