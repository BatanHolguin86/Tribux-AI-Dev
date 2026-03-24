# Tasks: Phase 06 — Launch & Deployment

**Feature:** Phase 06 — Launch Interactivo  
**Fase IA DLC:** Phase 06 — Launch & Deployment  
**Fecha:** 2026-03-08  
**Status:** Checklist UI implementada (marzo 2026); runbooks enlazados desde UI en backlog

**Alineación código:** `Phase06Layout`, `ChecklistCard`, `phase-06.ts` configs, toggle fase 6, `Phase06FinalGate`. Ver `docs/ESTADO-DEL-PRODUCTO.md`.

---

## Checklist de Implementacion

### UI y Flujo

- [x] **TASK-761:** Vista Phase 06 con `PhaseProgressHeader` y categorías tipo launch (deploy, monitoring, documentación, checklist)
- [x] **TASK-762:** Toggle por categoría + progreso en header; gate final al completar todas

### Integracion con Operaciones

- [x] **TASK-763:** `PhaseDocsCallout` con `docs/06-ops/apply-migrations-staging.md` y `sentry-setup.md`

### Alineacion v1.0 KIRO

- [ ] **TASK-709:** Revisar/crear `requirements.md` de Phase 06 para definir el minimo v1.0 (deploy manual pero guiado y documentado) y mover automatizaciones complejas de CI/CD a v1.1/v2
- [ ] **TASK-770:** Crear/actualizar `design.md` de Phase 06 describiendo como se mapea el launch checklist a datos persistidos y como se refleja el estado de lanzamiento en el proyecto
- [ ] **TASK-771:** Completar este `tasks.md` con cualquier tarea adicional que surja al cerrar requisitos y diseño de la fase para v1.0
