# Documentación — AI Squad Command Center

La carpeta `docs/` está ordenada según la **metodología IA DLC** (AI-Driven Development Lifecycle). En Cursor, el orden alfabético de las carpetas coincide con el orden de las fases: puedes leer de arriba a abajo para seguir el ciclo completo.

---

## Orden de lectura por fases IA DLC

| Carpeta | Fase | Contenido |
|---------|------|-----------|
| **00-discovery** | Phase 00 — Discovery & Ideation | Brief, personas, value proposition, métricas, análisis competitivo. Entregables de la primera fase. |
| **01-specs** | Phase 01 — Requirements & Spec (KIRO) | Specs KIRO por feature (requirements, design, tasks), PRD, Moscow, constraints, pricing. |
| **02-architecture** | Phase 02 — Architecture & Design | Diagramas, ADRs (Architecture Decision Records), decisiones de diseño. |
| **03-environment** | Phase 03 — Environment Setup | Referencia a configuración de entorno; contenido operativo en `/infrastructure/` en la raíz del repo. |
| **04-development** | Phase 04 — Core Development | Referencia al código fuente; implementación en `/src/` y tests en `/tests/` en la raíz del repo. |
| **05-qa** | Phase 05 — Testing & QA | Reportes de calidad, criterios de aceptación, documentación de QA. |
| **06-ops** | Phase 06 — Launch & Deployment | Runbooks operacionales, checklist de lanzamiento, monitoring. |

**Phase 07 — Iteration & Growth** (retrospectiva, backlog) no tiene carpeta dedicada en `docs/`; se documenta en el ciclo de producto y en el brief.

---

## Rutas rápidas

- **Empezar por el problema y la propuesta:** `00-discovery/brief.md`
- **Ver qué features está especificando el producto:** `01-specs/` (carpetas por feature: auth-onboarding, kiro-generator, orchestrator, etc.)
- **Priorización y alcance:** `01-specs/moscow.md`, `01-specs/prd.md`
- **Decisiones técnicas:** `02-architecture/decisions/`

---

*Estructura alineada con `CLAUDE.md` — Estructura del Proyecto.*
