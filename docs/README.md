# Documentación — Tribux

La carpeta `docs/` está ordenada según la **metodología IA DLC** (AI-Driven Development Lifecycle). En Cursor, el orden alfabético de las carpetas coincide con el orden de las fases: puedes leer de arriba a abajo para seguir el ciclo completo.

---

## Orden de lectura por fases IA DLC

| Carpeta             | Fase                                  | Contenido                                                                                             |
| ------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **00-discovery**    | Phase 00 — Discovery & Ideation       | Brief, personas, value proposition, métricas, análisis competitivo. Entregables de la primera fase.   |
| **01-specs**        | Phase 01 — Requirements & Spec (KIRO) | Specs KIRO por feature (requirements, design, tasks), PRD, Moscow, constraints, pricing.              |
| **02-architecture** | Phase 02 — Architecture & Design      | Diagramas, ADRs (Architecture Decision Records), decisiones de diseño.                                |
| **03-environment**  | Phase 03 — Environment Setup          | Referencia a configuración de entorno; contenido operativo en `/infrastructure/` en la raíz del repo. |
| **04-development**  | Phase 04 — Core Development           | Referencia al código fuente; implementación en `/src/` y tests en `/tests/` en la raíz del repo.      |
| **05-qa**           | Phase 05 — Testing & QA               | Reportes de calidad, criterios de aceptación, documentación de QA.                                    |
| **06-ops**          | Phase 06 — Launch & Deployment        | Runbooks operacionales, checklist de lanzamiento, monitoring.                                         |

**Phase 07 — Iteration & Growth:** specs KIRO en `docs/01-specs/11-phase-07-iteration/`; visión de roadmap en `docs/00-discovery/estatus-v1-y-roadmap.md`.

---

## Rutas rápidas

- **Estado del producto alineado con el código (revisar primero si mantienes docs):** [`ESTADO-DEL-PRODUCTO.md`](./ESTADO-DEL-PRODUCTO.md)
- **Checklists de implementación por feature/fase:** `01-specs/*/tasks.md` (todos sincronizados marzo 2026 con el código)
- **Empezar por el problema y la propuesta:** `00-discovery/01-brief.md`
- **Ver qué features está especificando el producto:** `01-specs/` (carpetas por feature: 01-auth-onboarding, 04-kiro-generator, 05-orchestrator, etc.)
- **Priorización y alcance:** `01-specs/03-moscow.md`, `01-specs/01-prd.md`
- **Avances, gaps y roadmap v1.0:** `00-discovery/estatus-v1-y-roadmap.md`
- **Go / No-go v1.0 y baseline QA:** `05-qa/v1-go-no-go.md`
- **Release v1.0 (despliegue, migraciones 021, buckets):** `06-ops/v1-release.md`
- **Decisiones técnicas (índice):** `02-architecture/decisions/README.md`
- **Diseño & UX en el producto (hub, Camino A/B, agente):** `01-specs/06-ui-ux-design-generator/` y ADR-007 en `02-architecture/decisions/ADR-007-design-hub-two-path-ux.md`

---

## Herramientas de desarrollo (raíz del repo)

| Recurso                               | Ubicación                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Variables de entorno (plantilla)      | `.env.example`                                                              |
| Plan enterprise para un usuario (dev) | `pnpm run plan:enterprise <email>` → `scripts/set-user-plan-enterprise.mjs` |
| SQL alternativo para plan de prueba   | `scripts/sql/grant-enterprise-test-user.sql`                                |
| Migraciones Supabase                  | `infrastructure/supabase/migrations/`                                       |
| Tests E2E documentados                | `05-qa/e2e-tests.md`                                                        |
| Go / No-go v1.0 (definición de hecho) | `05-qa/v1-go-no-go.md`                                                      |

---

_Estructura alineada con `CLAUDE.md` — Estructura del Proyecto._
