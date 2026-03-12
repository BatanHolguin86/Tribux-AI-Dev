# Tasks: Phase 05 — Testing & QA

**Feature:** Phase 05 — Testing & QA Interactivo  
**Fase IA DLC:** Phase 05 — Testing & QA  
**Fecha:** 2026-03-08  
**Status:** Pendiente definicion detallada (v1.0)

---

## Checklist de Implementacion

### UI y Flujo
- [ ] **TASK-751:** Crear vista de Phase 05 con `PhaseProgressHeader` y checklist de QA basado en `docs/05-qa/` (smoke, E2E principales, checks manuales clave)
- [ ] **TASK-752:** Permitir marcar cada test/check como completado y mostrar un resumen de cobertura minima alcanzada para v1.0

### Integracion con Tests
- [ ] **TASK-753:** Enlazar desde Phase 05 a `docs/05-qa/e2e-tests.md` y a los runbooks de QA relevantes, dejando claro que se ejecuta con Vitest vs Playwright

### Alineacion v1.0 KIRO
- [ ] **TASK-707:** Revisar/crear `requirements.md` de Phase 05 para definir el nivel minimo de QA v1.0 (flujos core cubiertos) y mover suites avanzadas a v1.1/v2
- [ ] **TASK-708:** Crear/actualizar `design.md` de Phase 05 describiendo como se mapean los tests (unit, integration, e2e) a la UI de la fase y a los checklists
- [ ] **TASK-710:** Actualizar `docs/05-qa/e2e-tests.md` para que liste explicitamente los flujos v1.0 (Auth+Onboarding, Phase 00, Phase 01, Orquestador+Agentes con adjuntos, Diseño UI/UX basico)
- [ ] **TASK-711:** Definir en un `design.md` o seccion de QA que test corre donde (Vitest vs Playwright), alineado con los checklists de Phase 05
- [ ] **TASK-712:** Crear o ajustar tests E2E adicionales necesarios para cubrir los flujos marcados como criticos en v1.0

