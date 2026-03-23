# Requirements: Generador KIRO — Phase 01 Interactivo

**Feature:** 04 — Generador KIRO (Phase 01)
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-08
**Status:** Pendiente aprobacion CEO/CPO

---

## Contexto

Phase 01 es donde la vision del usuario se convierte en especificaciones tecnicas accionables. Despues de aprobar Phase 00 (Discovery), el usuario tiene un brief, personas, value proposition, metricas y analisis competitivo — pero necesita traducir eso en features concretos con requisitos, disenos tecnicos y tareas de implementacion. El Generador KIRO guia esa traduccion a traves de una conversacion con el orquestador, produciendo tres documentos por feature: `requirements.md`, `design.md` y `tasks.md`.

La experiencia debe sentirse como una sesion de planificacion con un CTO experto que descompone la vision en piezas implementables, no como llenar templates.

---

## User Stories

### Entrada a Phase 01

- Como usuario que aprobo Phase 00, quiero que Phase 01 se abra mostrando un resumen del discovery aprobado como contexto, para entender que informacion ya tiene el sistema antes de comenzar a especificar.
- Como usuario, quiero ver claramente cuales features ya tengo especificados y cuales faltan, para tener orientacion de progreso.
- Como usuario que regresa, quiero retomar Phase 01 exactamente donde lo deje (features y documentos en progreso), para no perder trabajo.

### Definicion de Features

- Como usuario, quiero que el orquestador me sugiera una lista inicial de features a especificar basada en mi discovery, para tener un punto de partida claro.
- Como usuario, quiero poder agregar, renombrar, reordenar y eliminar features de la lista antes de comenzar a especificar, para tener control total sobre el alcance.
- Como usuario, quiero que el orquestador me recomiende un orden de priorizacion para especificar los features (dependencias primero), para no bloquearme despues.

### Generacion de requirements.md

- Como usuario, quiero que el orquestador me haga preguntas especificas sobre cada feature para generar las user stories, para no tener que inventar el formato yo mismo.
- Como usuario, quiero que las user stories se generen en formato "Como [rol], quiero [accion], para [beneficio]" con acceptance criteria verificables, para tener un estandar claro.
- Como usuario, quiero que el orquestador genere los non-functional requirements (performance, security, accessibility) contextualmente, para cubrir aspectos que yo podria olvidar.

### Generacion de design.md

- Como usuario, quiero que el orquestador me guie para definir el data model (tablas, campos, relaciones), para tener la base tecnica del feature.
- Como usuario, quiero que el diseno incluya el flujo UI/UX con descripcion de pantallas, para visualizar como se vera el feature.
- Como usuario, quiero que el orquestador genere los endpoints de API con request/response schemas, para tener contratos claros para desarrollo.
- Como usuario, quiero que el design.md incluya architecture decisions con justificacion, para entender el razonamiento detras de cada eleccion tecnica.

### Generacion de tasks.md

- Como usuario, quiero que el orquestador descomponga el feature en tasks atomicas y accionables agrupadas por area (DB, Backend, Frontend, Tests, Deploy), para tener un plan de ejecucion listo.
- Como usuario, quiero que las tasks tengan un orden sugerido de ejecucion y estimacion por semana, para planificar el desarrollo.
- Como usuario, quiero que el tasks.md incluya un Definition of Done del feature, para saber cuando esta completo.

### Validacion de Coherencia

- Como usuario, quiero que el sistema valide automaticamente la coherencia entre specs de diferentes features (tablas duplicadas, convenciones de naming, referencias cruzadas), para detectar inconsistencias antes de aprobar.

### Preview, Edicion y Aprobacion

- Como usuario, quiero ver el documento generado en un panel lateral con vista formateada mientras converso con el orquestador, para revisar en tiempo real.
- Como usuario, quiero poder editar cualquier documento generado directamente (modo raw) antes de aprobarlo, para ajustar detalles sin regenrar todo.
- Como usuario, quiero aprobar cada documento (requirements, design, tasks) individualmente por feature, para un control granular.
- Como usuario, quiero que al aprobar los 3 documentos de un feature este se marque como "spec completo", para ver progreso por feature.
- Como usuario, quiero que al aprobar todos los features se me presente un gate final de Phase 01, para una aprobacion consciente antes de avanzar a Phase 02.

---

## Acceptance Criteria

### Entrada y Contexto

- Al entrar a `/projects/:id/phase/01`, se muestra un resumen colapsable del Phase 00 aprobado (brief + personas + value proposition + metrics + competitive analysis)
- Si el usuario no ha aprobado Phase 00, se redirige a `/projects/:id/phase/00` con un aviso
- Si el usuario tiene features en progreso, la UI muestra el estado de cada feature y permite retomar

### Definicion de Features

- El orquestador sugiere entre 3 y 8 features iniciales basados en el discovery (analizando el brief, personas y value proposition)
- El usuario puede agregar features manualmente con nombre y descripcion corta
- El usuario puede editar nombre/descripcion, reordenar (drag & drop) y eliminar features de la lista
- El orquestador muestra un orden recomendado con justificacion de dependencias
- La lista de features se persiste en `project_features` (tabla dedicada con display_order, status, etc.)

### Generacion de Documentos KIRO

- Para cada feature, el orquestador genera 3 documentos en secuencia: requirements.md → design.md → tasks.md
- Cada documento se genera via conversacion guiada — el orquestador hace preguntas relevantes antes de generar
- El orquestador usa como contexto: el discovery completo aprobado + los specs de features previamente aprobados (evita contradicciones)
- Las respuestas del orquestador se muestran en streaming (primer token < 2s)
- El documento generado aparece en el panel lateral en menos de 20 segundos
- Los documentos se almacenan en Supabase Storage en `projects/{project_id}/specs/{feature-name}/`

### Contenido de requirements.md Generado

- Incluye: metadata (feature, fecha, status), contexto, user stories (minimo 5), acceptance criteria (checkbox format, minimo 8), non-functional requirements, out of scope
- User stories en formato "Como [rol], quiero [accion], para [beneficio]"
- Acceptance criteria son especificos, verificables y con valores medibles donde aplique

### Contenido de design.md Generado

- Incluye: overview, data model (SQL con tablas, RLS, constraints), UI/UX layout (descripcion visual de pantallas y componentes), API design (endpoints con request/response JSON), architecture decisions, dependencies
- El data model es coherente con tablas de features anteriores
- Los endpoints siguen convenciones RESTful del proyecto (Next.js Route Handlers)

### Validacion Automatica de Coherencia (v1.0)

- El sistema ejecuta validacion automatica al aprobar un documento (design.md, requirements.md) comparando con specs de features anteriores
- Se detectan: tablas o columnas duplicadas con nombres distintos, referencias a entidades inexistentes, violacion de convenciones de naming (snake_case, plural para tablas)
- Las inconsistencias detectadas se muestran al usuario antes de aprobar, con sugerencias de correccion

### Contenido de tasks.md Generado

- Incluye: checklist agrupado por areas (DB, Backend, Frontend, Tests, Deploy), orden de ejecucion sugerido, definition of done
- Cada task tiene ID unico (TASK-XXX), descripcion concreta y accionable
- La numeracion de tasks continua desde el ultimo feature especificado (no reinicia en TASK-001)

### Preview y Edicion

- El panel lateral muestra el documento generado en markdown renderizado con toggle a modo edicion raw
- Las ediciones manuales se auto-guardan con debounce de 1 segundo
- El orquestador reconoce ediciones manuales en el contexto de la siguiente interaccion

### Gates de Aprobacion

- Cada documento tiene boton "Aprobar" y opcion de solicitar revision con feedback
- Al aprobar los 3 documentos de un feature, el feature se marca como "spec completo" con indicador visual
- Al aprobar todos los features, aparece el gate final de Phase 01
- El gate final muestra resumen de todos los features y documentos aprobados con boton "Aprobar Phase 01 y avanzar a Phase 02"
- Al aprobar Phase 01: `project_phases` phase 1 → `completed`, phase 2 → `active`, `projects.current_phase` → 2
- Animacion de celebracion al aprobar Phase 01

### Restricciones de Plan

- Usuarios en plan Starter pueden completar Phase 01 sin restriccion
- El numero maximo de features por proyecto depende del plan: Starter (5), Builder (10), Agency (20); Enterprise (negociado en contrato)

---

## Non-Functional Requirements

- **Streaming:** Primer token de respuesta en < 2s; documento completo generado en < 30s
- **Persistencia:** Toda la conversacion, features y documentos se guardan en tiempo real — 0 perdida de datos si el usuario cierra el browser
- **Contexto IA:** El orquestador mantiene coherencia entre features — no contradice specs previamente aprobados
- **Accesibilidad:** Navegacion por teclado en la lista de features y en el chat; ARIA labels en todos los controles interactivos
- **Mobile:** La lista de features y el chat son funcionales en mobile; el panel de documento se muestra como tab alternativa

---

## Out of Scope

- Generacion automatica de codigo a partir de los specs — Phase 04
- Importar specs existentes desde archivos externos (Notion, Confluence, PDF) — v1.1
- Templates pre-generados de features comunes (auth, CRUD, pagos) — v1.1
- Colaboracion multi-usuario en la misma Phase 01 — v2.0
- Export de todos los specs como PDF o ZIP — v1.1
