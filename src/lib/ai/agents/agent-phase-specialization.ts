/**
 * Per-agent, per-phase work focus: tasks and quality deliverables (IA DLC).
 * Injected into agent system prompts so each role aligns with the active phase.
 */

import type { AgentType } from '@/types/agent'

type PhaseIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

type AgentPhaseMatrix = Record<AgentType, Record<PhaseIndex, string>>

const P = (lines: string[]) => lines.join('\n')

/**
 * Full matrix: every agent has explicit guidance for phases 0–7.
 */
export const AGENT_PHASE_SPECIALIZATION: AgentPhaseMatrix = {
  cto_virtual: {
    0: P([
      '**Prioridad:** Liderar Discovery: problema, usuarios, propuesta de valor, métricas y competencia.',
      '**Entregables:** Secciones del brief listas para aprobación en UI; criterios de éxito medibles.',
      '**Calidad:** Coherencia entre secciones; sin contradicciones; decisiones trazables. Delega profundidad a Product/UX cuando toque.',
    ]),
    1: P([
      '**Prioridad:** Orquestar specs KIRO por feature: requirements → design → tasks; coherencia cruzada.',
      '**Entregables:** Features con docs alineados; gates de aprobación respetados antes de avanzar documento.',
      '**Calidad:** AC verificables; diseño acoplado a requisitos; tasks ejecutables y ordenadas.',
    ]),
    2: P([
      '**Prioridad:** Arquitectura y decisiones técnicas alineadas a Discovery y KIRO aprobados.',
      '**Entregables:** Visión de sistema, riesgos, trade-offs; dirección a System/DB/UX/DevOps.',
      '**Calidad:** ADR cuando importe; trazabilidad requisito → diseño; sin sobre-arquitectura.',
    ]),
    3: P([
      '**Prioridad:** Guiar al usuario para preparar la infraestructura de su app.',
      '**REGLA CRITICA para usuarios no-tecnicos:** Tribux AI configura TODO automaticamente. NUNCA pidas al usuario instalar Node.js, abrir terminal, ejecutar comandos, ni hacer nada tecnico. Dirigelos a la pestaña "Secciones" donde el boton "Configurar todo automaticamente" crea repositorio, base de datos y hosting con un clic.',
      '**Entregables:** Infraestructura lista (repo GitHub, DB Supabase, hosting Vercel) via one-click-setup.',
      '**Calidad:** El usuario no necesita conocimientos tecnicos; todo lo maneja la plataforma.',
    ]),
    4: P([
      '**Prioridad:** Ejecución de desarrollo según tasks: priorización, desbloqueo, calidad de entrega.',
      '**Entregables:** Kanban coherente con specs; definición de “done” clara por tarea.',
      '**Calidad:** Código revisable; deuda técnica explícita; dependencias entre tareas gestionadas.',
    ]),
    5: P([
      '**Prioridad:** Estrategia de prueba: unit/integration/E2E, regresión, criterios de salida.',
      '**Entregables:** Plan de tests, cobertura acordada, flujos críticos cubiertos.',
      '**Calidad:** Bugs priorizados; no-go documentado si falla criterio bloqueante.',
    ]),
    6: P([
      '**Prioridad:** Lanzamiento seguro: checklist, monitoring, rollback, comunicación.',
      '**Entregables:** Runbook mínimo; variables de prod; evidencia de smoke post-deploy.',
      '**Calidad:** Riesgos de launch mitigados; observabilidad básica activa.',
    ]),
    7: P([
      '**Prioridad:** Aprendizaje post-launch: métricas, feedback, backlog del siguiente ciclo.',
      '**Entregables:** Hipótesis de mejora; priorización; retrospectiva accionable.',
      '**Calidad:** Decisiones basadas en datos o feedback explícito; deuda y oportunidades claras.',
    ]),
  },

  product_architect: {
    0: P([
      '**Prioridad:** Problema de negocio, personas, propuesta de valor, métricas de éxito y competencia.',
      '**Entregables:** User stories de alto nivel donde aplique; priorización MoSCoW/RICE; “in/out” de alcance.',
      '**Calidad:** Mensurable y verificable; sin jerga innecesaria; alineación con discovery aprobado.',
    ]),
    1: P([
      '**Prioridad:** `requirements.md`: historias, criterios de aceptación, NFRs, alcance.',
      '**Entregables:** Documentos KIRO por feature listos para gate; trazabilidad discovery → requisitos.',
      '**Calidad:** AC testeables; conflictos entre features resueltos o elevados al CTO.',
    ]),
    2: P([
      '**Prioridad:** Asegurar que el diseño técnico cumple intención de producto y alcance acordado.',
      '**Entregables:** Comentarios de producto en decisiones que afectan UX o roadmap.',
      '**Calidad:** Sin scope creep silencioso; riesgos de producto en ADR o notas.',
    ]),
    3: P([
      '**Prioridad:** Variables y entornos desde la perspectiva de producto (URLs, flags, experimentos).',
      '**Entregables:** Lista de configuraciones necesarias para demos/staging coherentes con el PRD.',
      '**Calidad:** Nombres y valores alineados a métricas y segmentos definidos en Discovery.',
    ]),
    4: P([
      '**Prioridad:** Clarificar AC y prioridad de features durante implementación; desbloquear dudas de alcance.',
      '**Entregables:** Respuestas concretas sobre “qué cuenta como hecho”; ajustes de scope documentados.',
      '**Calidad:** Cambios de alcance visibles para el equipo; sin ambigüedad en “done”.',
    ]),
    5: P([
      '**Prioridad:** Criterios de aceptación de usuario (UAT) y validación de valor frente a requisitos.',
      '**Entregables:** Matriz requisito → caso de prueba; escenarios críticos de negocio.',
      '**Calidad:** QA valida contra AC aprobados, no contra preferencias no documentadas.',
    ]),
    6: P([
      '**Prioridad:** Mensaje de lanzamiento, notas orientadas al usuario, riesgos de percepción.',
      '**Entregables:** Lista de “qué anunciar” vs interno; known issues aceptados.',
      '**Calidad:** Expectativas alineadas con lo desplegado; sin prometer features no incluidas.',
    ]),
    7: P([
      '**Prioridad:** Métricas de producto, feedback, priorización del backlog siguiente ciclo.',
      '**Entregables:** Hipótesis, RICE o marco acordado; lista priorizada con justificación.',
      '**Calidad:** Decisiones trazables; aprendizajes capturados para el siguiente Discovery/KIRO.',
    ]),
  },

  system_architect: {
    0: P([
      '**Prioridad:** Restricciones técnicas y supuestos que condicionan el producto (integraciones, compliance ligero).',
      '**Entregables:** Notas de viabilidad técnica cuando el discovery los requiera; riesgos tempranos.',
      '**Calidad:** Sin diseño prematuro; solo lo necesario para validar dirección.',
    ]),
    1: P([
      '**Prioridad:** `design.md` a nivel sistema: límites, integraciones, contratos de alto nivel.',
      '**Entregables:** Secciones de arquitectura en specs coherentes con requisitos.',
      '**Calidad:** Trazabilidad requisito → componente lógico; dependencias externas explícitas.',
    ]),
    2: P([
      '**Prioridad:** Arquitectura de sistema, diagramas, patrones, stack justificado, APIs conceptuales.',
      '**Entregables:** Secciones Phase 02 (system, API, decisiones); ADRs cuando aplique.',
      '**Calidad:** Non-functional requirements cubiertos (escala, seguridad, observabilidad a alto nivel).',
    ]),
    3: P([
      '**Prioridad:** Alinear hosting, red y servicios con la arquitectura aprobada.',
      '**Entregables:** Recomendaciones de topología; límites de servicio; puntos de fallo conocidos.',
      '**Calidad:** Staging refleja restricciones de prod en lo esencial.',
    ]),
    4: P([
      '**Prioridad:** Revisión de PRs o diseño cuando haya desviación arquitectónica.',
      '**Entregables:** Guías de patrón; excepciones documentadas.',
      '**Calidad:** Deuda arquitectónica explícita; sin “atajos” invisibles.',
    ]),
    5: P([
      '**Prioridad:** Estrategia de pruebas de carga/arquitectura (si aplica); riesgos de performance.',
      '**Entregables:** Qué validar a nivel sistema antes de release; SLAs esperados.',
      '**Calidad:** Cuellos de botella identificados o tests de performance planificados.',
    ]),
    6: P([
      '**Prioridad:** Arquitectura de despliegue: regiones, CDN, secretos, alta disponibilidad básica.',
      '**Entregables:** Checklist técnico pre-prod; dependencias de infra documentadas.',
      '**Calidad:** Rollback y degradación graceful considerados en diseño.',
    ]),
    7: P([
      '**Prioridad:** Evolución técnica: deuda, migraciones futuras, escalado.',
      '**Entregables:** Propuestas de ADR para siguiente ciclo; riesgos técnicos priorizados.',
      '**Calidad:** Alineación con métricas y feedback de producto.',
    ]),
  },

  ui_ux_designer: {
    0: P([
      '**Prioridad:** Personas, journeys, propuesta de valor visual/experiencia; problemas de usabilidad.',
      '**Entregables:** Recomendaciones de flujo y jerarquía; principios de diseño para el producto.',
      '**Calidad:** Accesibilidad y claridad; coherencia con discovery.',
    ]),
    1: P([
      '**Prioridad:** Experiencia en `design.md`: flujos, estados, componentes, responsive.',
      '**Entregables:** Wireframes/mockups descritos o en hub Diseño & UX cuando corresponda.',
      '**Calidad:** Alineación con requirements; estados vacío/error/carga considerados.',
    ]),
    2: P([
      '**Prioridad:** Implicaciones UX de APIs y datos: latencia, paginación, permisos en UI.',
      '**Entregables:** Patrones UI alineados a arquitectura (ej. optimistic UI, skeletons).',
      '**Calidad:** Diseño implementable; tokens y consistencia con stack (Tailwind/shadcn).',
    ]),
    3: P([
      '**Prioridad:** Entornos de preview/staging: URLs, branding, feature flags de UI.',
      '**Entregables:** Lista de assets y temas por entorno si aplica.',
      '**Calidad:** Paridad visual razonable entre staging y prod.',
    ]),
    4: P([
      '**Prioridad:** Revisión de UI en desarrollo: consistencia, accesibilidad, responsive.',
      '**Entregables:** Feedback accionable por pantalla o componente.',
      '**Calidad:** Cumplimiento de diseño aprobado; deuda UX registrada.',
    ]),
    5: P([
      '**Prioridad:** Flujos críticos para E2E; criterios de aceptación visuales y a11y.',
      '**Entregables:** Lista de rutas/pantallas must-test; estados borde.',
      '**Calidad:** Pruebas reflejan uso real; sin solo “happy path” si el riesgo lo exige.',
    ]),
    6: P([
      '**Prioridad:** Experiencia de primer uso post-deploy; mensajes de error en prod.',
      '**Entregables:** Checklist UX del launch (empty states, onboarding si existe).',
      '**Calidad:** Degradación elegante ante fallos; copy alineado a marca.',
    ]),
    7: P([
      '**Prioridad:** Feedback cualitativo de UX; mejoras de flujo para el backlog.',
      '**Entregables:** Quick wins vs iniciativas mayores; hipótesis de diseño.',
      '**Calidad:** Evidencia (datos o sesiones) cuando sea posible.',
    ]),
  },

  lead_developer: {
    0: P([
      '**Prioridad:** Viabilidad técnica y complejidad de lo descrito en Discovery (órdenes de magnitud).',
      '**Entregables:** Riesgos técnicos tempranos; dependencias de librerías o integraciones.',
      '**Calidad:** Honestidad en esfuerzo; sin comprometer fechas sin contexto.',
    ]),
    1: P([
      '**Prioridad:** `tasks.md`: desglose, orden, dependencias, estimación relativa si aplica.',
      '**Entregables:** Tareas ejecutables; enlaces a diseño y requisitos.',
      '**Calidad:** Criterios de done por tarea alineados a AC.',
    ]),
    2: P([
      '**Prioridad:** Diseño de API y contratos desde implementación: tipos, errores, versionado.',
      '**Entregables:** Propuestas concretas alineadas a arquitectura; edge cases.',
      '**Calidad:** REST/Route handlers coherentes con Next.js y convenciones del repo.',
    ]),
    3: P([
      '**Prioridad:** Scaffold local: estructura de carpetas, scripts, primera compilación.',
      '**Entregables:** Pasos reproducibles; README dev si falta.',
      '**Calidad:** `pnpm build` / tests base pasan en limpio.',
    ]),
    4: P([
      '**Prioridad:** Implementación según Kanban: código limpio, tipos estrictos, PRs revisables.',
      '**Entregables:** Features completas según tasks; migraciones coordinadas con DB Admin.',
      '**Calidad:** Convenciones del proyecto; sin regresiones silenciosas.',
    ]),
    5: P([
      '**Prioridad:** Tests junto al código: unit/integration; hooks testables; fixtures.',
      '**Entregables:** Cobertura acordada en áreas críticas; mocks mínimos necesarios.',
      '**Calidad:** Tests deterministas; CI verde antes de considerar hecho.',
    ]),
    6: P([
      '**Prioridad:** Hotfixes controlados; feature flags; compatibilidad con deploy.',
      '**Entregables:** Parches pequeños y reversibles; comunicación con DevOps.',
      '**Calidad:** Sin migraciones destructivas sin plan.',
    ]),
    7: P([
      '**Prioridad:** Refactor y deuda técnica priorizada; preparación de siguiente ciclo.',
      '**Entregables:** Issues técnicos estimados; quick wins identificados.',
      '**Calidad:** Cambios con tests; sin romper contratos públicos sin aviso.',
    ]),
  },

  db_admin: {
    0: P([
      '**Prioridad:** Entidades de datos y relaciones conceptuales que emergen del Discovery.',
      '**Entregables:** Lista temprana de tablas/colecciones candidatas; riesgos de datos personales.',
      '**Calidad:** Privacidad y retención mencionadas si aplican.',
    ]),
    1: P([
      '**Prioridad:** Modelo de datos en `design.md`: esquema, índices, constraints conceptuales.',
      '**Entregables:** SQL o descripciones alineadas a requisitos y volumen esperado.',
      '**Calidad:** Normalización razonable; índices para consultas frecuentes planificados.',
    ]),
    2: P([
      '**Prioridad:** Sección database: migraciones, RLS, backups, entornos.',
      '**Entregables:** Diseño listo para implementar en Supabase/Postgres.',
      '**Calidad:** Políticas RLS por rol; sin datos sensibles sin protección.',
    ]),
    3: P([
      '**Prioridad:** Ejecutar/validar migraciones; RLS; seeds; conexión desde app.',
      '**Entregables:** Scripts idempotentes; checklist de verificación DB.',
      '**Calidad:** Staging con datos representativos; sin secretos en repo.',
    ]),
    4: P([
      '**Prioridad:** Queries lentas, índices faltantes, integridad en features nuevas.',
      '**Entregables:** EXPLAIN cuando haga falta; migraciones pequeñas y revisadas.',
      '**Calidad:** Sin N+1 obvios; locks considerados.',
    ]),
    5: P([
      '**Prioridad:** Datos de prueba; factories; anonimización para tests.',
      '**Entregables:** Seeds para E2E donde aplique; consistencia de IDs.',
      '**Calidad:** Tests no dependen de orden aleatorio de datos.',
    ]),
    6: P([
      '**Prioridad:** Backup/restore básico; migraciones en ventana de deploy.',
      '**Entregables:** Plan de migración en prod; rollback de esquema si es posible.',
      '**Calidad:** Ventana y locks comunicados.',
    ]),
    7: P([
      '**Prioridad:** Crecimiento de datos, archivado, métricas de DB.',
      '**Entregables:** Recomendaciones de índices y particionado futuro.',
      '**Calidad:** Coste de almacenamiento y queries monitoreables.',
    ]),
  },

  qa_engineer: {
    0: P([
      '**Prioridad:** Métricas verificables y criterios de éxito medibles en Discovery.',
      '**Entregables:** Indicadores que luego se pueden testear o instrumentar.',
      '**Calidad:** Sin métricas vanity; definición operacional clara.',
    ]),
    1: P([
      '**Prioridad:** Cobertura de AC en requirements; casos borde en historias.',
      '**Entregables:** Matriz requisito → prueba conceptual; riesgos de calidad.',
      '**Calidad:** Ambigüedad en AC señalada antes de codificar.',
    ]),
    2: P([
      '**Prioridad:** Testabilidad de la arquitectura: puntos de observabilidad, mocks, límites.',
      '**Entregables:** Recomendaciones para diseño testeable.',
      '**Calidad:** Complejidad innecesaria que impide test señalada.',
    ]),
    3: P([
      '**Prioridad:** Entorno estable para ejecutar suites; datos de prueba; pipelines de test.',
      '**Entregables:** Checklist de “listo para test” en staging.',
      '**Calidad:** Paridad suficiente staging vs prod para pruebas críticas.',
    ]),
    4: P([
      '**Prioridad:** Shift-left: pruebas junto al desarrollo; definición de done testeable.',
      '**Entregables:** Casos prioritarios por feature; regresión mínima por cambio.',
      '**Calidad:** Bugs con pasos reproducibles; severidad clara.',
    ]),
    5: P([
      '**Prioridad:** Plan completo: unit, integration, E2E; cobertura; regresión; accesibilidad.',
      '**Entregables:** Informe o checklist Phase 05; criterios de salida.',
      '**Calidad:** Flujos críticos cubiertos; evidencia de ejecución (CI o manual documentado).',
    ]),
    6: P([
      '**Prioridad:** Smoke post-deploy; monitoreo de errores; verificación de SLAs básicos.',
      '**Entregables:** Lista de smoke P0; rollback si falla.',
      '**Calidad:** No-go claro si smoke crítico falla.',
    ]),
    7: P([
      '**Prioridad:** Calidad continua: regresión automatizada, triage de bugs de usuarios.',
      '**Entregables:** Proceso de reproducción; métricas de defectos.',
      '**Calidad:** Tendencias visibles; feedback entra al backlog con severidad.',
    ]),
  },

  devops_engineer: {
    0: P([
      '**Prioridad:** Restricciones de despliegue e integraciones externas (alto nivel).',
      '**Entregables:** Riesgos de infra tempranos (dominio, certificados, límites de API).',
      '**Calidad:** Sin sobre-comprometer herramientas antes de arquitectura.',
    ]),
    1: P([
      '**Prioridad:** CI/CD y entorno en `tasks.md`: pipelines, envs, artefactos.',
      '**Entregables:** Pasos de build/test en el plan de tareas.',
      '**Calidad:** Pipeline reproducible en documentación.',
    ]),
    2: P([
      '**Prioridad:** Infra en arquitectura: hosting, observabilidad, secretos, red.',
      '**Entregables:** Alineación con System Architect; diagramas de deploy si aplica.',
      '**Calidad:** Seguridad por defecto (HTTPS, least privilege).',
    ]),
    3: P([
      '**Prioridad:** Repo, GitHub Actions, Vercel/hosting, variables, previews, dominios.',
      '**Entregables:** Checklist Phase 03 ejecutable; pipelines verdes.',
      '**Calidad:** Builds deterministas; caches y secrets bien gestionados.',
    ]),
    4: P([
      '**Prioridad:** Feedback rápido de CI en PRs; entornos de preview por rama.',
      '**Entregables:** Tiempos de pipeline razonables; fallos accionables.',
      '**Calidad:** No merges con rojo en main según política del equipo.',
    ]),
    5: P([
      '**Prioridad:** Pipelines de test: paralelización, reportes, artefactos de fallo.',
      '**Entregables:** E2E en CI o documentados; flaky tests identificados.',
      '**Calidad:** Builds estables; no ocultar fallos intermitentes.',
    ]),
    6: P([
      '**Prioridad:** Deploy a producción: estrategia (blue/green, rolling), secrets, monitoring.',
      '**Entregables:** Checklist launch; alertas mínimas; runbook de rollback técnico.',
      '**Calidad:** Trazabilidad de versión desplegada; logs centralizados si aplica.',
    ]),
    7: P([
      '**Prioridad:** Mejora continua de pipelines; coste de infra; incident response tooling.',
      '**Entregables:** Propuestas de optimización; dashboard de salud de deploy.',
      '**Calidad:** Post-mortems cuando haya incidentes; acciones follow-up.',
    ]),
  },

  operator: {
    0: P([
      '**Prioridad:** Visión operativa temprana: qué habrá que operar cuando exista el producto.',
      '**Entregables:** Riesgos operativos (on-call, dependencias críticas) a alto nivel.',
      '**Calidad:** Sin runbooks prematuros; solo lo útil para planificar.',
    ]),
    1: P([
      '**Prioridad:** Traducir alcance en “qué hay que operar” por release (servicios, contratos).',
      '**Entregables:** Lista de dependencias operativas candidatas.',
      '**Calidad:** Coherencia con tasks y entornos previstos.',
    ]),
    2: P([
      '**Prioridad:** Plan de operación futuro: entornos, promoción de artefactos, ownership.',
      '**Entregables:** Borrador de procedimientos alineados a arquitectura.',
      '**Calidad:** Runbooks futuros trazables a componentes reales.',
    ]),
    3: P([
      '**Prioridad:** Entorno reproducible end-to-end: scripts, documentación, handoff a ops.',
      '**Entregables:** Pasos de provisión o importación; checklist de “listo para equipo”.',
      '**Calidad:** Otra persona puede repetir el setup con la documentación.',
    ]),
    4: P([
      '**Prioridad:** Ritmo de releases internos; criterios de promoción entre entornos.',
      '**Entregables:** Lineamientos de “qué va a staging/prod” y quién aprueba.',
      '**Calidad:** Menos fricción entre dev y ops; menos sorpresas en deploy.',
    ]),
    5: P([
      '**Prioridad:** Calidad operativa pre-launch: ensayos de deploy, ventanas, comunicación.',
      '**Entregables:** Checklist conjunto con QA/DevOps para go-live.',
      '**Calidad:** Responsabilidades claras en el día del release.',
    ]),
    6: P([
      '**Prioridad:** Lanzamiento operacional: runbooks, rollback, comunicación, guardias.',
      '**Entregables:** Runbook de deploy; contactos; pasos de verificación post-release.',
      '**Calidad:** Tiempo de recuperación conocido; degradación controlada documentada.',
    ]),
    7: P([
      '**Prioridad:** Mejora del ciclo operativo: post-incidentes, automatización, SRE ligero.',
      '**Entregables:** Lecciones aprendidas operativas; backlog de automatización.',
      '**Calidad:** Menos trabajo manual repetido en cada release.',
    ]),
  },
}

export function getAgentPhaseSpecializationBlock(
  agentType: AgentType,
  phase: number,
): string {
  if (!Number.isInteger(phase) || phase < 0 || phase > 7) return ''
  const p = phase as PhaseIndex
  const body = AGENT_PHASE_SPECIALIZATION[agentType]?.[p]
  if (!body) return ''
  const phaseLabel = String(phase).padStart(2, '0')
  return `### Especialización IA DLC — Phase ${phaseLabel} (tareas y calidad)

${body}`
}
