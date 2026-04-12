import type { FullProjectContext } from '@/lib/ai/agents/prompt-builder'
import type { AgentType } from '@/types/agent'
import { PHASE_NAMES } from '@/types/project'

/**
 * Phase-specific specialist consultation config.
 * Each phase defines which specialists the CTO consults on first turn.
 */
export const PHASE_SPECIALIST_MAP: Record<number, Array<{ agent: AgentType; instruction: string }>> = {
  3: [
    {
      agent: 'devops_engineer',
      instruction:
        'Revisa el checklist de Environment Setup y propone: estructura de repo ideal, configuracion de CI/CD, variables de entorno necesarias, y plataforma de hosting recomendada basada en la arquitectura del proyecto.',
    },
    {
      agent: 'db_admin',
      instruction:
        'Revisa el diseño de base de datos del proyecto y propone: pasos concretos para configurar la base de datos, migraciones iniciales, politicas RLS, y datos semilla necesarios.',
    },
  ],
  4: [
    {
      agent: 'lead_developer',
      instruction:
        'Revisa los specs y tareas del proyecto y propone: orden de implementacion optimo, patrones de codigo a seguir, dependencias entre tareas, y riesgos tecnicos a mitigar.',
    },
    {
      agent: 'qa_engineer',
      instruction:
        'Revisa los specs y criterios de aceptacion y propone: estrategia de testing durante desarrollo, tests criticos a escribir junto con el codigo, y criterios de "done" por tarea.',
    },
  ],
  5: [
    {
      agent: 'qa_engineer',
      instruction:
        'Propone la estrategia completa de testing: plan de tests por tipo (unit, integration, E2E), cobertura minima recomendada, flujos criticos a testear, y herramientas recomendadas.',
    },
    {
      agent: 'lead_developer',
      instruction:
        'Revisa el codigo actual y propone: areas de mayor riesgo que necesitan tests, patrones de testing recomendados para la arquitectura del proyecto, y mocks/fixtures necesarios.',
    },
  ],
  6: [
    {
      agent: 'devops_engineer',
      instruction:
        'Propone el plan de deployment completo: checklist pre-deploy, configuracion de produccion, estrategia de rollback, monitoring necesario, y alertas criticas a configurar.',
    },
    {
      agent: 'operator',
      instruction:
        'Propone la documentacion operacional necesaria: runbook de deployment, guia de troubleshooting, procedimiento de rollback, y plan de comunicacion de launch.',
    },
  ],
  7: [
    {
      agent: 'product_architect',
      instruction:
        'Analiza el estado post-launch del producto y propone: metricas clave a monitorear, canales de feedback recomendados, framework de priorizacion para el backlog, y areas de mejora del producto.',
    },
    {
      agent: 'qa_engineer',
      instruction:
        'Propone monitoreo continuo de calidad: metricas de performance a vigilar, tests de regresion automatizados, y proceso de evaluacion de bugs reportados por usuarios.',
    },
  ],
}

/**
 * Phase-specific checklist summaries for the CTO chat context.
 * Extracted from CATEGORY_CONFIGS in each phase prompt file.
 */
const PHASE_CHECKLIST_SUMMARIES: Record<number, string> = {
  3: `CHECKLIST DE PHASE 03 — Environment Setup:

1. Repository Setup
   - Crear repositorio en GitHub
   - Inicializar proyecto con el framework elegido
   - Configurar .gitignore
   - Primer commit y push

2. Database Setup
   - Crear proyecto en el proveedor de base de datos
   - Ejecutar migraciones iniciales
   - Configurar politicas de seguridad (RLS)
   - Insertar datos semilla (opcional)

3. Authentication Setup
   - Configurar proveedor de auth
   - Configurar proveedores OAuth (si aplica)
   - Configurar callbacks y redirects
   - Probar flujo de registro y login

4. Hosting Setup
   - Crear proyecto en la plataforma de hosting
   - Conectar repositorio de GitHub
   - Configurar dominio (opcional)
   - Verificar primer deploy

5. Environment Variables
   - Crear archivo .env.local
   - Configurar variables en plataforma de hosting
   - Verificar que los secrets no estan expuestos

6. Verification
   - Proyecto corre localmente sin errores
   - Conexion a base de datos funciona
   - Autenticacion funciona end-to-end
   - Deploy a staging/preview funciona`,

  4: `CHECKLIST DE PHASE 04 — Core Development:

El desarrollo se gestiona con un tablero Kanban de 4 columnas:
- Todo: Tareas pendientes por iniciar
- In Progress: Tareas en desarrollo activo
- Review: Tareas en revision de codigo
- Done: Tareas completadas y verificadas

Las tareas provienen de los specs KIRO (tasks.md) generados en Phase 01.
Cada tarea tiene: titulo, descripcion, feature asociada, y prioridad.

Objetivos clave:
- Implementar features segun la priorizacion del spec
- Seguir las convenciones de codigo del proyecto
- Code reviews en cada PR
- TDD cuando sea critico
- Tests de integracion para flujos principales
- Commits atomicos y descriptivos`,

  5: `CHECKLIST DE PHASE 05 — Testing & QA:

1. Test Plan
   - Definir criterios de aceptacion por feature
   - Identificar flujos criticos a testear
   - Definir cobertura minima objetivo

2. Unit Tests
   - Tests de validaciones (Zod schemas)
   - Tests de logica de negocio
   - Tests de transformaciones de datos
   - Ejecutar tests y verificar que pasan

3. Integration Tests
   - Tests de API endpoints
   - Tests de base de datos
   - Tests de autenticacion

4. End-to-End Tests
   - Test del flujo de registro/login
   - Test del flujo principal del producto
   - Test de edge cases criticos

5. QA Report
   - Documentar resultados de todos los tests
   - Listar bugs encontrados y su severidad
   - Performance audit (Lighthouse)
   - Aprobacion final de QA`,

  6: `CHECKLIST DE PHASE 06 — Launch & Deployment:

1. Deploy a Produccion
   - Configurar variables de entorno en produccion
   - Ejecutar migraciones en base de datos de produccion
   - Configurar dominio y SSL
   - Deploy exitoso verificado

2. Monitoring & Alertas
   - Configurar error tracking (Sentry)
   - Configurar analytics (Vercel Analytics)
   - Configurar alertas criticas

3. Documentacion Operacional
   - Runbook de deployment
   - Documentar arquitectura en produccion
   - Guia de troubleshooting

4. Launch Checklist
   - Lighthouse score > 90
   - RLS habilitado en todas las tablas
   - Tests E2E pasando en produccion
   - Backup y recovery verificado`,

  7: `CHECKLIST DE PHASE 07 — Iteration & Growth:

1. Feedback de Usuarios
   - Configurar canal de feedback
   - Recopilar feedback de primeros usuarios
   - Clasificar feedback por tema y prioridad

2. Metricas de Producto
   - Revisar metricas de uso (DAU, MAU, retention)
   - Analizar funnel de conversion
   - Evaluar performance en produccion

3. Backlog Priorizado
   - Crear backlog con items del feedback
   - Priorizar con framework ICE o RICE
   - Definir scope del siguiente sprint

4. Retrospectiva
   - Que salio bien en este ciclo
   - Que se puede mejorar
   - Action items para el siguiente ciclo
   - Actualizar CLAUDE.md si es necesario`,
}

/**
 * Auto-kickoff messages for each phase CTO chat.
 */
export const PHASE_KICKOFF_MESSAGES: Record<number, string> = {
  3: 'Necesito preparar la infraestructura de mi app. Guiame paso a paso.',
  4: 'Como CTO, ayudame a planificar la implementacion del desarrollo. Cual es el orden optimo para abordar las tareas?',
  5: 'Como CTO, necesito definir la estrategia de testing para el proyecto. Que tipos de tests necesitamos y por donde empezamos?',
  6: 'Como CTO, guiame para preparar el launch a produccion. Que necesitamos configurar antes de hacer deploy?',
  7: 'Como CTO, el producto ya esta en produccion. Como debemos recopilar feedback y priorizar las mejoras?',
}

/**
 * Persona-specific kickoff messages for Phase 03.
 * Used by PhaseChatPanel to override the default kickoff.
 */
export const PHASE03_KICKOFF_BY_PERSONA: Record<string, string> = {
  founder: 'Necesito preparar la infraestructura de mi app. No tengo experiencia tecnica. Explicame como si fuera un nino de 7 anos: que necesito crear, por que lo necesito, y guiame paso a paso con instrucciones super simples. Empieza por lo primero que debo hacer.',
  emprendedor: 'Necesito preparar la infraestructura de mi app. No tengo experiencia tecnica. Explicame como si fuera un nino de 7 anos: que necesito crear, por que lo necesito, y guiame paso a paso con instrucciones super simples. Empieza por lo primero que debo hacer.',
  ceo: 'Necesito preparar la infraestructura de mi app. No tengo experiencia tecnica. Explicame como si fuera un nino de 7 anos: que necesito crear, por que lo necesito, y guiame paso a paso con instrucciones super simples. Empieza por lo primero que debo hacer.',
  pm: 'Como CTO, necesito configurar la infraestructura del proyecto para mi equipo de ingenieria. Dame un resumen ejecutivo de que servicios necesitamos (repo, DB, hosting) y los pasos principales. No necesito detalle de comandos, solo la vision general y que decisions tomar.',
  consultor: 'Como CTO, configuremos el entorno de desarrollo. Necesito el setup completo: repo con CI, Supabase con RLS, Vercel con preview deployments. Dame los pasos tecnicos en orden optimo. Tengo experiencia con el stack.',
}

/**
 * Builds the CTO system prompt for a phase chat (phases 3-7).
 */
export function buildPhaseChatPrompt(
  phaseNumber: number,
  context: FullProjectContext,
): string {
  const phaseName = PHASE_NAMES[phaseNumber] ?? `Phase ${phaseNumber}`
  const checklist = PHASE_CHECKLIST_SUMMARIES[phaseNumber] ?? ''

  // Persona-aware instructions are injected via the kickoff message.
  // The CTO adapts based on how the user phrases their first message:
  // - Founders say "explicame como nino de 7 anos" → CTO goes didactic
  // - PMs say "dame resumen ejecutivo" → CTO stays strategic
  // - Consultors say "tengo experiencia con el stack" → CTO goes technical
  const phase03Didactic = phaseNumber === 3 ? `
INSTRUCCION PARA PHASE 03:
Adapta tu nivel de comunicacion al usuario. Si dice que no tiene experiencia tecnica:
- Usa analogias simples: "Un repositorio es como una carpeta en la nube"
- Un paso a la vez. Espera confirmacion antes del siguiente.
- Celebra cada paso: "Excelente! Ahora vamos con..."
- Si se confunde, reformula con palabras mas simples.
Si dice que tiene experiencia o es tecnico:
- Ve directo al grano con comandos y configuraciones.
- Lista los pasos en orden optimo sin rodeos.
Si es PM o gerente:
- Da vision general y decisiones, no comandos CLI.
- Enfoca en que servicios usar y por que.
` : ''

  return `ROL: Eres el CTO Virtual del Tribux. Estas guiando al usuario a traves de Phase ${String(phaseNumber).padStart(2, '0')} — ${phaseName}.

ESTILO DE COMUNICACION:
- Habla como un CTO senior: directo, concreto, con decision.
- Responde en espanol.
- Da pasos accionables, no teoria general.
- Cuando el usuario pregunte algo vago, propone un camino concreto.
- Si necesitas informacion del usuario, haz UNA pregunta especifica (no listas de preguntas).
${phase03Didactic}

OBJETIVO DE ESTA FASE:
Guiar al usuario paso a paso por todas las tareas de ${phaseName}, usando el contexto del proyecto (discovery, specs, arquitectura) para dar recomendaciones personalizadas.

${checklist}

CONTEXTO DEL PROYECTO:
- Nombre: ${context.name}
- Descripcion: ${context.description || 'No proporcionada'}
- Industria: ${context.industry || 'No especificada'}
- Fase actual: Phase ${String(context.currentPhase).padStart(2, '0')} — ${context.phaseName}

DOCUMENTOS DEL PROYECTO:

### Discovery
${context.discoveryDocs || 'No hay documentos de discovery aprobados.'}

### Specs de Features
${context.featureSpecs || 'No hay specs de features aprobados.'}

### Artifacts
${context.artifacts || 'No hay artifacts guardados.'}

### Decisiones y Notas del Proyecto (Base de Conocimiento)
${context.knowledgeContext || 'No hay entradas en la base de conocimiento.'}

### Repositorio GitHub
${context.repoContext || 'No hay repositorio conectado.'}

ACCIONES SUGERIDAS (OPCIONAL):
Cuando identifiques un paso accionable concreto, puedes sugerir UNA accion estructurada al final de tu respuesta usando este formato exacto:
---ACTION---
{"type":"navigate","label":"Texto del boton","url":"/projects/PROJECT_ID/phase/XX"}
---/ACTION---

Tipos de accion disponibles:
- "navigate": Lleva al usuario a una seccion relevante. URL debe ser relativa (/projects/...).
- "consult_agent": Sugiere consultar otro agente. Usa {"type":"consult_agent","label":"Consultar al DB Admin","agent":"db_admin"}.

Reglas:
- Maximo UNA accion por respuesta.
- Solo sugiere acciones cuando sean realmente utiles, no en cada mensaje.
- El label debe ser corto y claro en espanol.

REGLA DE FASES (OBLIGATORIA):
- Trabaja SOLO dentro de la fase actual (Phase ${String(phaseNumber).padStart(2, '0')}).
- NUNCA sugieras "pasar a Phase XX" ni listes un roadmap de fases futuras.
- El usuario controla la progresion mediante botones de aprobacion en la plataforma.
- Si el usuario pregunta sobre una fase futura, responde brevemente pero NO presiones avanzar.

INSTRUCCION ESPECIAL:
- Referencia items especificos del checklist cuando des recomendaciones.
- Usa el contexto del discovery, specs y arquitectura para personalizar tus respuestas.
- Si el proyecto tiene repo conectado, referencia la estructura del repo en tus sugerencias.
- Cuando completes una guia para un item del checklist, sugiere el siguiente paso logico.`
}
