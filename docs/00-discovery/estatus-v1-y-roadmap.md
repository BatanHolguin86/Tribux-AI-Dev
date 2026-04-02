# Estatus v1.0 y roadmap — AI Squad Command Center

**Última actualización:** 2026-04-01  
**Complementa:** [`docs/ESTADO-DEL-PRODUCTO.md`](../ESTADO-DEL-PRODUCTO.md) (qué hay en código) y [`docs/05-qa/v1-go-no-go.md`](../05-qa/v1-go-no-go.md) (criterios verificables de release).

---

## 1. Objetivo v1.0

Entregar una **v1.0** usable de punta a punta para el flujo **IA DLC** en la app (Next.js + Supabase): discovery y specs (00–01), arquitectura y diseño (02), entorno y construcción (03–04), QA y lanzamiento (05–06), iteración (07), con agentes y hub de diseño integrados — sin pretender automatizar todo el trabajo externo (pipelines, consolas de terceros).

La definición operativa de alcance y limitaciones está en [`docs/06-ops/v1-release.md`](../06-ops/v1-release.md).

---

## 2. Fases del roadmap (referencia)

| Fase | Enfoque | Estado documental |
| ---- | ------- | ------------------- |
| **A** | Errores de IA unificados, checklist go/no-go, E2E local estable | Entregables cerrados en [`docs/05-qa/v1-go-no-go.md`](../05-qa/v1-go-no-go.md) (tabla «Entregables roadmap Fase A») |
| **B–C** | Profundización funcional, checklists por ítem, narrativa de cierre | Avance continuo en código + specs `docs/01-specs/` |
| **D** | Release: staging/prod, migraciones, buckets, variables | Runbook [`docs/06-ops/v1-release.md`](../06-ops/v1-release.md) |

---

## 3. Dónde está el “estado” hoy

| Necesidad | Documento |
| --------- | --------- |
| Qué módulos existen y rutas principales | [`docs/ESTADO-DEL-PRODUCTO.md`](../ESTADO-DEL-PRODUCTO.md) |
| Si se puede llamar **v1.0** (criterios + baseline) | [`docs/05-qa/v1-go-no-go.md`](../05-qa/v1-go-no-go.md) |
| Cómo desplegar y qué migrar | [`docs/06-ops/v1-release.md`](../06-ops/v1-release.md) |
| Índice de decisiones técnicas | [`docs/02-architecture/decisions/README.md`](../02-architecture/decisions/README.md) |

---

## 4. Próximos pasos (hasta cierre v1.0)

1. Completar evidencia en **staging** para los criterios **3–10** del go/no-go (IA, auth/onboarding manual, fases, agentes, diseño, E2E, BD/storage, envs).
2. Aplicar **todas** las migraciones de `infrastructure/supabase/migrations/` al proyecto Supabase de staging y validar RLS/buckets según [`v1-release.md`](../06-ops/v1-release.md).
3. Re-ejecutar **`pnpm test:e2e`** antes del corte de release (ver notas de puerto y credenciales en [`docs/05-qa/v1-go-no-go.md`](../05-qa/v1-go-no-go.md)).

---

## 5. Discovery de negocio (fase 00 metodológica)

Los briefs y material de discovery siguen en la misma carpeta: `01-brief.md`, `02-personas.md`, `03-value-proposition.md`, etc.
