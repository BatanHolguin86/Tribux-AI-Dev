# Tasks: Phase 05 — Testing & QA

**Feature:** Phase 05 — Testing & QA Interactivo  
**Fase IA DLC:** Phase 05 — Testing & QA  
**Fecha:** 2026-03-08  
**Status:** Checklist UI implementada (marzo 2026); docs KIRO y E2E extra en backlog

**Alineación código:** `Phase05Layout`, `ChecklistCard`, `PHASE05_SECTIONS` / `CATEGORY_CONFIGS` en `src/lib/ai/prompts/phase-05.ts`, toggle `.../phases/5/sections/.../toggle`, `Phase05FinalGate`. Ver `docs/ESTADO-DEL-PRODUCTO.md`.

---

## Checklist de Implementacion

### UI y Flujo

- [x] **TASK-751:** Vista Phase 05 con `PhaseProgressHeader` y categorías de QA (cards con ítems guionados)
- [x] **TASK-752:** Toggle por categoría + contador en header; resumen cualitativo (no métrica de cobertura de código automatizada en UI)

### Integracion con Tests

- [x] **TASK-753:** `PhaseDocsCallout` con `docs/05-qa/e2e-tests.md`, smoke staging y comandos `pnpm test` / `pnpm test:e2e`

### Alineacion v1.0 KIRO

- [ ] **TASK-707:** Revisar/crear `requirements.md` de Phase 05 para definir el nivel minimo de QA v1.0 (flujos core cubiertos) y mover suites avanzadas a v1.1/v2
- [ ] **TASK-708:** Crear/actualizar `design.md` de Phase 05 describiendo como se mapean los tests (unit, integration, e2e) a la UI de la fase y a los checklists
- [x] **TASK-710:** `docs/05-qa/e2e-tests.md` lista flujos y archivos Playwright/Vitest (mantener al día con nuevos `*.spec.ts`)
- [ ] **TASK-711:** Definir en un `design.md` o seccion de QA que test corre donde (Vitest vs Playwright), alineado con los checklists de Phase 05
- [ ] **TASK-712:** E2E adicionales para gaps _(p. ej. diseño hub dedicado; parte cubierta por `agents-with-attachments` etc.)_
