# Tasks: Generador de diseños UI/UX

**Feature:** Generador de diseños UI/UX (wireframes y mockups) + hub Diseño & UX
**Fase IA DLC:** Phase 02 — Architecture & Design
**Fecha:** 2026-03-08 · sincronizado con código marzo 2026
**Status:** Checklist histórico; ver **Estado en código** abajo para lo ya entregado

---

## Estado en código (marzo 2026) — sincronizar con este checklist

Entregado en aplicación (puede no cubrir todos los ítems numerados inferiores):

- [x] **HUB:** Vista `/projects/[id]/designs` como hub **Diseño & UX** — Camino A (generate + lista + detalle) y Camino B (6 herramientas + chat con contexto Discovery y `design-tool-workflow`).
- [x] **API:** `POST .../designs/generate`, `GET .../designs`, `GET/PATCH .../designs/[id]`, `POST .../refine` (ver `src/app/api/projects/[id]/designs/`).
- [x] **Tipos:** `src/types/design.ts` y validaciones en `src/lib/validations/designs.ts`.
- [x] **UX:** `ProjectBreadcrumb`, `ProjectTools` («Diseño & UX»), `ArtifactDetail` con iframe + controles de dispositivo (mobile/tablet/desktop).
- [x] **ADR-007** en `docs/02-architecture/decisions/ADR-007-design-hub-two-path-ux.md`.
- [x] **HTML visual:** Wireframes, mockups low-fi y high-fi generan HTML + Tailwind CSS renderizable (nunca ASCII art). Prompts dedicados en `src/lib/ai/prompts/design-generation.ts` con `TYPE_INSTRUCTIONS` detallados por nivel.
- [x] **Almacenamiento dual:** Contenido HTML en columna `content` de DB (primaria) + Storage bucket best-effort.
- [x] **`generateText`:** Generación síncrona (no streaming) para garantizar completitud del HTML.
- [x] **Rate limiting:** `DESIGN_RATE_LIMIT` aplicado a generate y refine.
- [x] **Gate Phase 01 relajado:** Permite generar con Phase 01 `active` + al menos un feature con specs.
- [x] **Agente UI/UX Designer:** Prompt actualizado — genera HTML visual con Tailwind en chat (nunca ASCII art). Templates actualizados con descripciones HTML.
- [x] **`maxOutputTokens: 8192`** para soportar HTML rico en mockups multi-pantalla.

Pendiente típico respecto al spec original: bloque explícito en Phase 02 (TASK-016), thumbnails en lista, job asíncrono dedicado si se separa del flujo actual, TASK-020 detección en chat, E2E dedicado.

---

## Checklist de Implementacion

### Setup & Base de datos
- [ ] **TASK-001:** Crear migracion `00X_create_design_artifacts.sql` — tabla `design_artifacts` con RLS e indices segun design.md
- [ ] **TASK-002:** Crear bucket Supabase Storage `project-designs` (privado) y politicas RLS por `project_id` / `user_id` propietario
- [ ] **TASK-003:** Definir helper para extraer lista de pantallas/flujos desde `design.md` del proyecto (parseo de seccion UI flow o equivalente)

### Backend — API
- [ ] **TASK-004:** Crear `POST /api/projects/[projectId]/designs/generate` — valida Phase 01 completada, acepta type + screens + refinement, crea registros en `design_artifacts` con status `generating` y encola job
- [ ] **TASK-005:** Implementar job/worker (o serverless invocable) que para cada pantalla: llama al agente/LLM con contexto (design.md, requirements, refinement), obtiene wireframe (SVG/HTML o imagen), sube a Storage, actualiza `design_artifacts.storage_path` y status a `draft`
- [ ] **TASK-006:** Crear `GET /api/projects/[projectId]/designs` — lista artefactos del proyecto con thumbnail_url (signed o route)
- [ ] **TASK-007:** Crear `GET /api/projects/[projectId]/designs/[artifactId]` — detalle + signed download_url
- [ ] **TASK-008:** Crear `PATCH /api/projects/[projectId]/designs/[artifactId]` — actualizar `status` (draft/approved) y `updated_at`
- [ ] **TASK-009:** Crear `POST /api/projects/[projectId]/designs/[artifactId]/refine` — recibe instruction, regenera diseño (reutilizar logica del job), actualiza archivo en Storage y `prompt_used`
- [ ] **TASK-010:** Crear schema Zod en `src/lib/validations/designs.ts` — body de generate, refine y PATCH status
- [ ] **TASK-011:** Rate limiting o cuota por proyecto para `/designs/generate` y `/refine` (segun constraints del producto)

### Frontend — Vistas
- [ ] **TASK-012:** Crear ruta `src/app/(dashboard)/projects/[id]/designs/page.tsx` — lista de diseños (grid o tabla) con miniatura, nombre, tipo, estado, acciones (ver, refinar, aprobar, descargar)
- [ ] **TASK-013:** Crear ruta `src/app/(dashboard)/projects/[id]/designs/[artifactId]/page.tsx` — detalle: imagen full-size, metadatos, botones Refinar, Aprobar para desarrollo, Descargar
- [ ] **TASK-014:** Crear componente `DesignGenerateModal` — selector de pantallas (desde API o desde design.md), tipo (wireframe / mockup_lowfi / mockup_highfi), campo opcional refinamiento, boton Generar; cierra y refresca lista al exito
- [ ] **TASK-015:** Crear componente `DesignRefineForm` — input instruccion, boton Refinar; usado en pagina de detalle
- [ ] **TASK-016:** Integrar bloque “Diseño UI/UX” en Phase 02: en `projects/[id]/phase/02` mostrar resumen de diseños existentes + boton “Generar wireframes” que abre `DesignGenerateModal`; enlace a “Ver todos” → `/projects/[id]/designs`
- [ ] **TASK-017:** Mostrar estado “Generando…” en lista y detalle (polling o actualizacion en tiempo real) hasta que `status` pase de `generating` a `draft`
- [ ] **TASK-018:** Añadir enlace “Diseño” en sidebar del proyecto (junto a Documentos, Phase 02, etc.) que apunte a `/projects/[id]/designs`

### Agente UI/UX Designer
- [ ] **TASK-019:** Registrar agente “UI/UX Designer” en config de agentes (tipo, nombre, system prompt) — rol: generar wireframes/mockups a partir de specs y user flows; instrucciones de refinamiento
- [ ] **TASK-020:** En el flujo del chat del agente UI/UX Designer: detectar intención de generación (ej. “genera wireframes para Login y Dashboard”) y llamar a `POST /api/projects/[projectId]/designs/generate` con pantallas extraídas del mensaje; responder con enlaces a los diseños generados o en cola
- [ ] **TASK-021:** Dar al agente acceso a contexto del proyecto: design.md, requirements.md, nombre e industria del proyecto (incluidos en context o via llamada interna)

### Integración y guards
- [ ] **TASK-022:** En `GET /designs` y en UI de generación: si el proyecto no tiene Phase 01 completada, devolver 400 con mensaje claro y en front mostrar mensaje “Completa Phase 01 (KIRO) para generar diseños” sin permitir generación
- [ ] **TASK-023:** En Phase 04 (Core Development): en documentación o panel del proyecto, mostrar enlace a “Diseños aprobados” (filtrar por `status = 'approved'`) para que Frontend Dev los consulte

### Tipos y tests
- [ ] **TASK-024:** Crear `src/types/design.ts` — tipos `DesignArtifact`, `DesignType`, `DesignStatus`, request/response de generate y refine
- [ ] **TASK-025:** Tests unitarios para schemas Zod de designs (`tests/unit/validations/designs.test.ts`)
- [ ] **TASK-026:** Test E2E opcional: usuario con proyecto en Phase 02 genera wireframe, ve lista, abre detalle, aprueba y descarga

### Deploy y documentación
- [ ] **TASK-027:** Variables de entorno para generación (API de imágenes si se usa; timeouts para jobs)
- [ ] **TASK-028:** Documentar en `docs/02-architecture/` o ADR la decisión de generación (LLM+SVG/HTML vs API de imágenes) y ubicación de artefactos (Storage path)

### Alineacion v1.0 KIRO
- [ ] **TASK-601:** Revisar `requirements.md` del Generador de diseños UI/UX para definir explicitamente el alcance v1.0 (wireframes/diseños textuales mínimos y, opcionalmente, mockups low-fi) y mover a v1.1/v2 lo que requiera image APIs avanzadas, Figma, prototipos interactivos, etc.
- [ ] **TASK-602:** Escribir o actualizar `design.md` minimo viable del Generador de diseños con el modelo de datos (`design_artifacts`), rutas API, integracion con Phase 02 y referencia desde Phase 04, asegurando que describe la implementacion actual
- [ ] **TASK-603:** Ajustar este `tasks.md` para separar claramente tareas v1.0 (MVP navegable de diseños en el proyecto) y backlog posterior, alineado con la estrategia de producto
- [ ] **TASK-604:** Implementar migracion y modelo para `design_artifacts` en Supabase, conectandolo con el bucket de diseños y garantizando RLS adecuada
- [ ] **TASK-605:** Implementar la API de generacion de diseños (`POST /designs/generate`) usando el agente UI/UX Designer y el contexto KIRO como input, guardando resultados en `design_artifacts`
- [ ] **TASK-606:** Implementar la vista "Diseño" en el proyecto (`/projects/[id]/designs`) que liste diseños con nombre de pantalla/flujo, tipo, estado y fecha, y permita navegar al detalle
- [ ] **TASK-607:** Permitir marcar diseños como "aprobado para desarrollo" y mostrarlos filtrados en Phase 04 como referencia para el Frontend Dev

---

## Orden de Ejecucion Sugerido

```
Semana 1: TASK-001 → 011 (DB, Storage, API, validaciones, rate limit)
Semana 2: TASK-012 → 018 (Frontend vistas, modal, integración Phase 02 y sidebar)
Semana 3: TASK-019 → 023 (Agente UI/UX Designer, integración chat, guards, Phase 04)
Semana 4: TASK-024 → 028 (Tipos, tests, deploy, ADR)
```

---

## Definition of Done — Generador de diseños UI/UX

- [ ] Wireframes generables por pantalla/flujo a partir de design.md
- [ ] Mockups low-fi generables para pantallas clave (opcional en v1 si se prioriza solo wireframes)
- [ ] Diseños almacenados en Storage y listados en vista `/projects/[id]/designs`
- [ ] Usuario puede refinar con instrucción en lenguaje natural y aprobar para desarrollo
- [ ] Agente UI/UX Designer puede generar diseños desde el chat con contexto del proyecto
- [ ] Phase 02 muestra bloque Diseño UI/UX y enlace a diseños; Phase 04 puede referenciar diseños aprobados
- [ ] RLS y Storage policies restringen acceso al propietario del proyecto
- [ ] Rate limiting o cuota aplicada a generación/refine
- [ ] Tests de validación y E2E (si aplica) pasando
