# Tasks: Phase 04 — Core Development

**Feature:** Phase 04 — Core Development Interactivo  
**Fase IA DLC:** Phase 04 — Core Development  
**Fecha:** 2026-03-08  
**Status:** Kanban + tasks persistidas (marzo 2026); enlaces explícitos a diseños en backlog

**Alineación código:** `Phase04Layout`, `KanbanBoard`, `project_tasks` + `PATCH .../phases/4/tasks/[taskId]`, `Phase04FinalGate`, tab Equipo. Ver `docs/ESTADO-DEL-PRODUCTO.md`.

---

## Checklist de Implementacion

### UI y Flujo

- [x] **TASK-741:** Vista Phase 04 con `PhaseProgressHeader` + **Kanban** (`KanbanBoard`) alimentado por tasks derivadas de KIRO (vacío hasta que existan tasks en BD)
- [x] **TASK-742:** Mover tasks entre columnas; progreso = tasks `done` / total; persistencia por API

### Integracion con Specs

- [ ] **TASK-743:** Bloque UI con enlaces a documentos KIRO y a **`/projects/[id]/designs`** (diseños aprobados) _(hoy solo copy que menciona specs Phase 01; sin links en panel)_

### Alineacion v1.0 KIRO

- [ ] **TASK-704:** Revisar/crear `requirements.md` de Phase 04 para definir el alcance v1.0 (seguimiento manual pero claro del trabajo de desarrollo) y aplazar Kanban interactivo completo a v1.1
- [ ] **TASK-705:** Crear/actualizar `design.md` de Phase 04 describiendo como se calculan los indicadores de progreso, que datos se muestran (links a tasks KIRO, diseños) y la interaccion basica del usuario
- [ ] **TASK-706:** Completar este `tasks.md` con tareas adicionales derivadas de `requirements.md` y `design.md` una vez cerrados para v1.0
