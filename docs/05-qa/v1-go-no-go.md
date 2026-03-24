# Go / No-go v1.0 — AI Squad Command Center

**Propósito:** Checklist corta y verificable para decidir si el producto puede etiquetarse **v1.0** y desplegarse a producción (o beta cerrada). Complementa `docs/ESTADO-DEL-PRODUCTO.md` y `docs/00-discovery/estatus-v1-y-roadmap.md`.

**Cómo usarla:** Marcar cada ítem con evidencia (enlace a CI, captura, o nota de commit). Si un ítem crítico falla → **no-go** hasta corregir o documentar excepción aprobada por negocio.

---

## Criterios (bloqueantes para v1.0)

| #   | Criterio                                        | Verificación                                                                                    | Estado |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------ |
| 1   | **Typecheck**                                   | `pnpm exec tsc --noEmit` sin errores.                                                           | ⬜     |
| 1b  | **ESLint**                                      | `pnpm lint` sin errores _(deuda conocida: reglas `no-explicit-any`, `set-state-in-effect`, etc.; planificar sprint de higiene)_. | ⬜     |
| 2   | **Tests automatizados base**                    | `pnpm test` (Vitest) verde: unit + integración.                                                 | ⬜     |
| 3   | **IA configurada**                              | En staging: `ANTHROPIC_API_KEY` válida; Phase 00 / agentes muestran error claro si falta clave. | ⬜     |
| 4   | **Auth + onboarding + primer proyecto**         | Happy path: registro/login (o login test), onboarding, proyecto creado, acceso a Phase 00.      | ⬜     |
| 5   | **Phase 00 + Phase 01 (KIRO)**                 | Generación/aprobación mínima documentada; flujo coherente con gates.                            | ⬜     |
| 6   | **Agentes + Equipo**                            | Chat CTO en tab Equipo; threads; Starter con paywall en agentes Builder donde aplique.          | ⬜     |
| 7   | **Hub Diseño & UX**                             | `/projects/[id]/designs` accesible con Phase 01 en estado permitido; generate o Camino B usable.  | ⬜     |
| 8   | **E2E críticos**                                | Subconjunto acordado en verde (ver sección siguiente). `pnpm test:e2e` en CI o manual documentado. | ⬜     |
| 9   | **Base de datos y Storage**                     | Migraciones aplicadas en staging; buckets necesarios (`project-documents`, `project-chat`, `project-designs` si aplica) y RLS comprobados. | ⬜     |
| 10  | **Variables de entorno**                        | `.env.example` al día; Vercel/staging con vars mínimas (Supabase, app URL, opcional Stripe).    | ⬜     |

---

## Subconjunto E2E recomendado para v1.0

Ajustar según acuerdo del equipo; punto de partida:

| Prioridad | Spec / flujo                                                                 | Notas                                      |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| P0        | `auth.spec.ts`, `protected-routes.spec.ts`                                  | Sin credenciales extra                     |
| P0        | `phase-00.spec.ts`, `phase-01.spec.ts`                                        | Redirects / acceso sin auth completo       |
| P1        | `smoke-staging.authenticated.spec.ts` o equivalente local con sesión         | Requiere `TEST_USER_*`                     |
| P1        | `agents-paywall.authenticated.spec.ts`                                       | Requiere usuario Starter en BD             |
| P2        | `agents.authenticated.spec.ts`, `agents-with-attachments.authenticated.spec.ts` | Requieren Anthropic / créditos             |

Listado completo: `docs/05-qa/e2e-tests.md`.

### Registro baseline — 2026-03-24

| Comando              | Resultado                                                                 |
| -------------------- | ------------------------------------------------------------------------- |
| `pnpm exec tsc --noEmit` | ✅ OK                                                                     |
| `pnpm test`          | ✅ 668 tests (46 archivos)                                                |
| `pnpm lint`          | ❌ 37 errors / 23 warnings (preexistentes; no bloqueó corrección TS tests) |
| `pnpm test:e2e`      | Ejecutar con `CI` desactivado si `localhost:3000` está ocupado (`reuseExistingServer`). Último run: **13 passed**, **26 skipped**, **0 failed** (home: link «Comenzar gratis» acotado a `navigation` por strict mode de Playwright). |

**Notas E2E**

- Si `CI=true` en el entorno y el puerto 3000 está en uso, Playwright falla al levantar `webServer`. Usar `CI= pnpm test:e2e` o liberar el puerto.
- Tests autenticados requieren `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` y proyecto con onboarding; si faltan, el proyecto `setup` se salta y los `*.authenticated.spec.ts` quedan skipped.

---

## No bloqueantes v1.0 (explícitos)

- OAuth Google E2E completo; flujo forgot-password end-to-end.
- `POST .../agents/.../stop` en servidor (abort solo en cliente).
- Thumbnails en lista de diseños; job async largo dedicado para generate.
- Lighthouse > 85 en dashboard.
- Phase 07 con formulario libre de retrospectiva persistido (TASK-782).

---

## Historial de decisiones

| Fecha        | Resultado | Notas                                                                 |
| ------------ | --------- | --------------------------------------------------------------------- |
| 2026-03-24   | Baseline  | TS + Vitest + E2E (suite local) verdes; checklist creada; ESLint en deuda documentada |
