# Tasks: Phase 03 — Environment Setup

**Feature:** Phase 03 — Environment Setup Interactivo  
**Fase IA DLC:** Phase 03 — Environment Setup  
**Fecha:** 2026-03-08  
**Status:** UI base implementada (marzo 2026); specs KIRO 701–703 en backlog

**Alineación código:** `Phase03Layout`, `ChecklistCategory`, categorías en `src/lib/ai/prompts/phase-03.ts`, persistencia `POST .../phases/3/sections/[section]/toggle`, gate `Phase03FinalGate`, tab **Equipo**. Ver `docs/ESTADO-DEL-PRODUCTO.md`.

---

## Checklist de Implementacion

### UI y Flujo

- [x] **TASK-731:** Vista Phase 03 con `PhaseProgressHeader` y checklist por categorías (`ChecklistCategory` + `PHASE03_SECTIONS`)
- [x] **TASK-732:** Marcar categorías completadas y persistir por proyecto vía API de secciones (`phase_sections` / toggle route)
- [ ] **TASK-733:** Enlaces **directos** en UI a archivos de `docs/06-ops/` _(hoy el copy guía al usuario; sin links markdown clicables al repo)_

### Integracion con Fases

- [x] **TASK-734:** Gate final `Phase03FinalGate` + `POST .../phases/3/approve` — completa Phase 03 y desbloquea Phase 04

### Alineacion v1.0 KIRO

- [ ] **TASK-701:** Revisar/crear `requirements.md` de Phase 03 para definir el alcance minimo v1.0 (entorno local + staging listo y documentado) y mover a v1.1/v2 cualquier automatizacion avanzada
- [ ] **TASK-702:** Crear/actualizar `design.md` de Phase 03 describiendo los datos usados por el checklist, la integracion con Supabase/Vercel y el uso de `PhaseProgressHeader`
- [ ] **TASK-703:** Completar este `tasks.md` con tareas adicionales si se detectan gaps tras la revision de requisitos y diseño
