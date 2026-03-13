# Tasks: Project Dashboard

**Feature:** 02 — Project Dashboard
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-06
**Status:** v1.0 — Implementado

---

## Checklist de Implementacion

### Base de Datos
- [x] **TASK-041:** Crear migracion `003_create_project_phases.sql` — tabla `project_phases` con RLS y constraint unique(project_id, phase_number)
- [x] **TASK-042:** Crear funcion y trigger `on_project_created` que inicializa las 8 filas de `project_phases` al insertar un proyecto (phase 0 → active, phases 1–7 → locked)
- [x] **TASK-043:** Crear migracion `004_add_last_activity_to_projects.sql` — agregar columna `last_activity` a `projects` con default `now()`
- [x] **TASK-044:** Crear funcion y trigger `on_phase_updated` que actualiza `projects.last_activity` y `projects.current_phase` cuando cambia el status de una fase

### Backend — API Routes
- [x] **TASK-045:** Crear `GET /api/projects` — retorna proyectos del usuario con progreso calculado, resumen global y soporte de query param `?status=active|archived`
- [x] **TASK-046:** Crear `POST /api/projects` — crea proyecto, valida limite de plan, retorna proyecto creado con id
- [x] **TASK-047:** Crear `PATCH /api/projects/:id` — actualiza nombre, descripcion o status; valida ownership via RLS
- [x] **TASK-048:** Crear `GET /api/projects/:id/phases` — retorna las 8 fases con status, nombre legible y fechas
- [x] **TASK-049:** Crear schema Zod `src/lib/validations/project.ts` — createProject (name, description, industry), updateProject (name?, description?, status?)
- [x] **TASK-050:** Crear helper `src/lib/projects/get-next-action.ts` — logica que determina el texto de "siguiente accion" segun la fase activa y documentos pendientes

### Tipos TypeScript
- [x] **TASK-051:** Actualizar `src/types/project.ts` — agregar tipos `ProjectWithProgress`, `ProjectPhase`, `PhaseStatus`, `DashboardSummary`
- [x] **TASK-052:** Crear `src/types/phase.ts` — tipo `PhaseMeta` con nombre, descripcion e icono de cada una de las 8 fases; exportar constante `PHASES_META` como source of truth

### Frontend — Layout y Pagina
- [x] **TASK-053:** Crear layout `src/app/(dashboard)/layout.tsx` — incluye nav global (logo, nombre de usuario, link a cuenta, logout)
- [x] **TASK-054:** Crear `src/app/(dashboard)/dashboard/page.tsx` — Server Component que fetcha proyectos con `createServerClient` y pasa datos a `ProjectsGrid`
- [x] **TASK-055:** Crear `src/app/(dashboard)/dashboard/loading.tsx` — skeleton loader con 3 tarjetas fantasma en grid
- [x] **TASK-056:** Crear `src/app/(dashboard)/dashboard/error.tsx` — error boundary con mensaje amigable y boton de retry

### Frontend — Componentes Core
- [x] **TASK-057:** Crear `DashboardHeader.tsx` — stats bar ("X proyectos · X fases esta semana") + boton "Nuevo proyecto" que abre `CreateProjectModal`
- [x] **TASK-058:** Crear `ProjectsGrid.tsx` — Client Component que recibe proyectos como props, maneja estado de busqueda y tab activo (Activos/Archivados), renderiza grid de `ProjectCard` o `EmptyState`
- [x] **TASK-059:** Crear `ProjectCard.tsx` — tarjeta con: industry tag, menu de opciones, nombre, descripcion truncada, fase activa, barra de progreso, mini timeline de iconos, "siguiente accion", fecha relativa y boton "Continuar"
- [ ] **TASK-060:** Crear `ProjectCardExpanded.tsx` — extension de la tarjeta que muestra timeline completo de 8 fases con iconos de estado, nombres y fechas; toggle animado con CSS transition
- [ ] **TASK-061:** Crear `PhaseTimeline.tsx` — componente reutilizable del timeline de 8 fases; acepta props `phases: ProjectPhase[]` y `variant: 'mini' | 'full'`
- [x] **TASK-062:** Crear `ProgressBar.tsx` — barra de progreso con porcentaje numerico; acepta `value: number` (0-100) y `size: 'sm' | 'md'`
- [x] **TASK-063:** Crear `IndustryTag.tsx` — tag con color segun industria; mapeado desde constante `INDUSTRY_COLORS`
- [x] **TASK-064:** Crear `EmptyState.tsx` — componente reutilizable con ilustracion SVG, titulo, descripcion y CTA opcional; acepta props para customizar cada estado vacio

### Frontend — Modals y Dialogs
- [x] **TASK-065:** Crear `CreateProjectModal.tsx` — modal con formulario (RHF + Zod), campos nombre/descripcion/industria, submit llama `POST /api/projects`, redirige a `/projects/:id/phase/00` al crear
- [x] **TASK-066:** Crear `EditProjectModal.tsx` — modal pre-cargado con datos del proyecto, submit llama `PATCH /api/projects/:id`, actualiza estado local con `useOptimistic`
- [x] **TASK-067:** Crear `ArchiveConfirmDialog.tsx` — dialogo de confirmacion con nombre del proyecto; submit llama `PATCH /api/projects/:id` con `status: archived`, actualiza lista con `useOptimistic`
- [x] **TASK-068:** Crear `PlanLimitModal.tsx` — modal que se muestra cuando el usuario supera el limite del plan; muestra comparacion de planes y CTA de upgrade

### Frontend — Busqueda y Estado
- [x] **TASK-069:** Implementar busqueda en tiempo real en `ProjectsGrid` — filtrado en memoria sobre el array de proyectos, sin debounce (respuesta inmediata < 20 proyectos)
- [x] **TASK-070:** Implementar persistencia del tab activo y busqueda en la URL como query params (`?tab=archived&search=delivery`) — usar `useSearchParams` y `useRouter` de Next.js

### Stores
- [x] **TASK-071:** Crear `src/stores/projects-store.ts` — store Zustand con: lista de proyectos, metodo para agregar/actualizar/archivar proyecto localmente (para `useOptimistic`)

### Tests
- [ ] **TASK-072:** Tests unitarios para `get-next-action.ts` — cubrir todos los casos de fase activa y documentos pendientes (`tests/unit/projects/`)
- [x] **TASK-073:** Tests unitarios para validaciones Zod de proyecto (`tests/unit/validations/project.test.ts`)
- [ ] **TASK-074:** Test de integracion para `GET /api/projects` — verifica calculo de progreso y summary (`tests/integration/api/projects.test.ts`)
- [ ] **TASK-075:** Test E2E — flujo completo: crear proyecto → ver en dashboard → expandir timeline → archivar → restaurar (`tests/e2e/dashboard.spec.ts`)
- [ ] **TASK-076:** Test E2E — limite de plan: usuario Starter intenta crear segundo proyecto → ve modal de upgrade (`tests/e2e/plan-limits.spec.ts`)

### Alineacion v1.0 KIRO
- [x] **TASK-540:** Revisar `requirements.md` de Project Dashboard — v1.0 incluye vista de proyectos, progreso, creacion, archivo/restauracion, limite de plan basico
- [ ] **TASK-541:** Crear o actualizar `design.md` del dashboard con el modelo de datos y flujos actuales
- [x] **TASK-542:** Completar y ajustar este `tasks.md` con tareas v1.0 pendientes y backlog posterior
- [x] **TASK-543:** Implementar o ajustar en el codigo los limites por plan y estados vacios

### Deploy
- [x] **TASK-077:** Aplicar migraciones 003 y 004 en base de datos staging
- [x] **TASK-078:** Verificar que el trigger `on_project_created` inicializa correctamente las 8 fases en staging
- [ ] **TASK-079:** Smoke test del dashboard en staging: crear proyecto, ver progreso, archivar, restaurar
- [ ] **TASK-080:** Lighthouse audit del dashboard — Performance > 85, Accessibility > 95

---

## Definition of Done — Feature 02

- [x] Dashboard muestra proyectos del usuario con progreso y fase activa
- [x] Crear proyecto funcional con redirect a Phase 00
- [x] Limite de plan enforceado con modal de upgrade
- [x] Archivar y restaurar proyectos funcional
- [x] Edicion de nombre/descripcion funcional
- [x] Busqueda en tiempo real funcional
- [x] Tabs Activos/Archivados funcionales
- [ ] Timeline de fases expandible en cada tarjeta
- [x] "Siguiente accion" correcta por fase activa
- [x] SSR verificado (HTML pre-renderizado en source)
- [x] Optimistic updates funcionando sin lag visible
- [ ] Tests E2E pasando en staging
- [ ] Lighthouse Performance > 85 en staging
