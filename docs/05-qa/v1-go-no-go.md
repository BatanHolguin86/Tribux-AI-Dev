# Go / No-go v1.0 — Tribux AI

**Propósito:** Checklist corta y verificable para decidir si el producto puede etiquetarse **v1.0** y desplegarse a producción (o beta cerrada). Complementa `docs/ESTADO-DEL-PRODUCTO.md` y `docs/00-discovery/estatus-v1-y-roadmap.md`.

**Cómo usarla:** Marcar cada ítem con evidencia (enlace a CI, captura, o nota de commit). Si un ítem crítico falla → **no-go** hasta corregir o documentar excepción aprobada por negocio.

---

## Criterios (bloqueantes para v1.0)


| #   | Criterio                                | Verificación                                                                                                                               | Estado |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1   | **Typecheck**                           | `pnpm exec tsc --noEmit` sin errores.                                                                                                      | ✅      |
| 1b  | **ESLint**                              | `pnpm lint` sin **errores** (warnings restantes: principalmente `no-unused-vars`; limpiar en higiene).                                     | ✅      |
| 2   | **Tests automatizados base**            | `pnpm test` (Vitest) verde: 56 archivos, **716 tests**, 0 fallos.                                                                          | ✅      |
| 2b  | **Build producción**                    | `pnpm build` exitoso (Next.js). Vercel deploy **Ready** en 1m 32s.                                                                         | ✅      |
| 3   | **IA configurada**                      | `ANTHROPIC_API_KEY` en Vercel (Mar 13). Deploy exitoso con 10 env vars.                                                                     | ✅      |
| 4   | **Auth + onboarding + primer proyecto** | Login funcional en staging. Usuario existente con onboarding completado y proyecto activo.                                                   | ✅      |
| 5   | **Phase 00 + Phase 01 (KIRO)**          | Usuario confirmó flujo completo en staging (Phases 00-07 recorridas).                                                                       | ✅      |
| 6   | **Agentes + Equipo**                    | Pendiente verificación formal: chat CTO, threads, paywall en agentes Builder.                                                               | ⬜      |
| 7   | **Hub Diseño & UX**                     | Pendiente verificación formal: `/projects/[id]/designs` accesible.                                                                          | ⬜      |
| 8   | **E2E críticos**                        | P0: **17/17** passed vs staging (auth, protected-routes, api-routes, phases, agents). P1 pendiente credenciales test user.                   | ✅      |
| 9   | **Base de datos y Storage**             | Migraciones aplicadas en staging; buckets necesarios (`project-documents`, `project-chat`, `project-designs` si aplica) y RLS comprobados. | ⬜      |
| 10  | **Variables de entorno**                | **16 vars** en Vercel (Supabase, Anthropic, Sentry, Resend, App URL + 6 PLATFORM_*). `.env.example` al día.                                 | ✅      |


**Nota:** Los ítems **1–5, 10** verificados en staging (2026-04-08). Los ítems **6–9** pendientes de verificación formal.

---

## Subconjunto E2E recomendado para v1.0

Ajustar según acuerdo del equipo; punto de partida:


| Prioridad | Spec / flujo                                                                    | Notas                                |
| --------- | ------------------------------------------------------------------------------- | ------------------------------------ |
| P0        | `auth.spec.ts`, `protected-routes.spec.ts`                                      | Sin credenciales extra               |
| P0        | `phase-00.spec.ts`, `phase-01.spec.ts`, `api-routes.spec.ts` (401 en APIs críticas) | Redirects / acceso; APIs sin sesión |
| P1        | `smoke-staging.authenticated.spec.ts` o equivalente local con sesión            | Requiere `TEST_USER_`*               |
| P1        | `agents-paywall.authenticated.spec.ts`                                          | Requiere usuario Starter en BD       |
| P2        | `agents.authenticated.spec.ts`, `agents-with-attachments.authenticated.spec.ts` | Requieren Anthropic / créditos       |


Listado completo: `docs/05-qa/e2e-tests.md`.

### Entregables roadmap Fase A (mar 2026) — ✅


| Entregable                                     | Evidencia / notas                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Errores de IA unificados en rutas `streamText` | JSON `error`/`message`; UI `ChatErrorBanner` en chats afectados; `formatChatErrorResponse` |
| Checklist go/no-go v1                          | Este documento + enlaces desde `docs/README.md` y `estatus-v1-y-roadmap.md`                |
| E2E estabilizados (local)                      | `pnpm test:e2e` — 0 fallos con setup en `e2e-tests.md` / notas de `CI` y puerto 3000       |


Los ítems de la tabla **Criterios (bloqueantes)** siguen marcándose con evidencia por entorno (staging/prod) antes del release.

### Registro baseline — 2026-04-08 (actual)

| Comando                  | Resultado                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `pnpm exec tsc --noEmit` | ✅ OK                                                                                                          |
| `pnpm test`              | ✅ **716** tests (**56** archivos) — incl. credit-packs, ai-usage-cleanup, quota-with-credits                  |
| `pnpm build`             | ✅ OK — Vercel deploy **Ready** (commit `f64db4e`)                                                             |
| Vercel staging (Tribux AI)  | ✅ **Ready** — `https://ai-squad-command-center.vercel.app` (slug histórico del proyecto en Vercel) — 10 env vars, build 1m 32s |
| Auth staging             | ✅ Login funcional, usuario con onboarding completado, proyecto activo con fases recorridas                    |
| IA staging               | ✅ `ANTHROPIC_API_KEY` configurada en Vercel (Mar 13)                                                          |

**Commits de referencia:** `f64db4e` (tests + fixes), `6c23cbc` (build fix), `6cf0a07` (consumption dashboard), `78ae61b` (pricing + top-ups), `b73b99e` (P&L)

---

### Registro baseline — 2026-04-01


| Comando                  | Resultado                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec tsc --noEmit` | ✅ OK                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test`              | ✅ **695** tests (**53** archivos) — incl. integración API (`integrations`, `costs`, `agent-chat`/`onboarding` alineados a rutas)                                                                                                                                                                                                                                                                        |
| `pnpm lint`              | ✅ 0 errores / **~31** warnings (principalmente `no-unused-vars`; no fallan el comando)                                                                                                                                                                                                                                                  |
| `pnpm build`             | ✅ OK (Next.js, rutas dinámicas incl. phase 03–07)                                                                                                                                                                                                                                                                                       |
| `pnpm test:e2e`          | **Re-ejecutar** antes del corte de release. Si `localhost:3000` está ocupado: `CI= pnpm test:e2e` o `reuseExistingServer` en config. Último run **completo** documentado: ver histórico **2026-03-24** (13 passed / 26 skipped / 0 failed). Nuevo spec `api-routes.spec.ts` añadido en commit `c6a561e` — incluir en la corrida de QA. |


#### Revisión automatizada (2026-04-01)

- **Commit de referencia (tests + gates locales):** `c6a561e` — tests integración/E2E API, fixes suites (`onboarding`, `agent-chat`, `phase-00`), export testeable en `context-builder`.
- **Commits históricos (contexto):** `48baa68` (checklists/API), `7f17134` (docs v1-release / migraciones).
- **Decisión:** criterios **1–2b** siguen ✅ con evidencia local; **3–10** pendientes de **staging** y evidencia manual/CI.

#### Histórico — registro baseline 2026-03-24


| Comando                  | Resultado                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec tsc --noEmit` | ✅ OK                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test`              | ✅ **676** tests (**48** archivos) — incl. integración `phase-section-item`                                                                                                                                                                                                                                                              |
| `pnpm lint`              | ✅ 0 errores / **23** warnings                                                                                                                                                                                                                                                                                                          |
| `pnpm build`             | ✅ OK                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:e2e`          | **13 passed**, **26 skipped**, **0 failed** (home: link «Comenzar gratis» acotado a `navigation` por strict mode de Playwright).                                                                                                                                                                                                          |

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


| Fecha      | Resultado            | Notas                                                                                                                                               |
| ---------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-01 | Baseline (local)     | `tsc` + `lint` (0 errores) + `test` (**695**) + `build` OK; doc actualizada; criterios 1–2b ✅; 3–10 siguen ⬜ staging; commit `c6a561e`              |
| 2026-03-24 | Baseline             | TS + Vitest + E2E (suite local) verdes; checklist creada; ESLint 0 errores                                                                          |
| 2026-03-24 | Lint                 | Eliminados `no-explicit-any` en rutas chat/generate; `set-state-in-effect` vía ref/microtask; Playwright `import` dotenv; ignore `scripts/**/*.cjs` |
| 2026-03-24 | Fase A               | Roadmap Fase A cerrada: errores IA + checklist + E2E local estable (ver tabla «Entregables roadmap Fase A»)                                         |
| 2026-03-24 | Revisión D (parcial) | `tsc` + `lint` (0 errores) + `test` (676) + `build` OK; criterios 1–2b marcados ✅; pendiente staging/usuario en 3–10; commits `48baa68` / `7f17134` |


