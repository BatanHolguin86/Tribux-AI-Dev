# Tests E2E — Tribux

## Requisitos previos

```bash
pnpm exec playwright install
```

Instala los navegadores que Playwright usa (Chromium, etc.).

## Ejecutar tests

```bash
pnpm test:e2e
```

O con UI:

```bash
pnpm exec playwright test --ui
```

## Estructura

| Archivo                                                               | Cobertura                                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `tests/e2e/auth.setup.ts`                                             | Setup: login y guardado de sesión (requiere credenciales)                                                                 |
| `tests/e2e/auth.spec.ts`                                              | Login, registro, forgot-password; páginas cargan y muestran formularios                                                   |
| `tests/e2e/protected-routes.spec.ts`                                  | Redirección a login cuando no hay sesión                                                                                  |
| `tests/e2e/api-routes.spec.ts`                                        | APIs críticas sin sesión: respuestas **401** (Playwright `request`, sin navegador)                                         |
| `tests/e2e/phase-00.spec.ts`                                          | Phase 00: redirect sin auth (usuario no autenticado)                                                                      |
| `tests/e2e/phase-00.authenticated.spec.ts`                            | Phase 00 con sesión: carga y muestra chat input (happy path mínimo)                                                       |
| `tests/e2e/phase-01.spec.ts`                                          | Phase 01: acceso y redirects básicos (sin sesión / sin Phase 00 aprobada)                                                 |
| `tests/e2e/phase-01.authenticated.spec.ts`                            | Phase 01 con sesión: flujo principal de KIRO (features + documentos)                                                      |
| `tests/e2e/agents.spec.ts`                                            | Agentes: redirect a login sin auth                                                                                        |
| `tests/e2e/agents.authenticated.spec.ts`                              | Agentes con sesión: cargar, crear conversación, enviar mensaje, flujo con artifact (requiere créditos Anthropic)          |
| `tests/e2e/smoke-staging.authenticated.spec.ts`                       | Smoke TASK-176: dashboard → Phase 00 → Phase 01; comprueba carga de páginas clave (local o staging)                       |
| `tests/e2e/agents-paywall.authenticated.spec.ts`                      | TASK-222: usuario Starter ve agentes Builder bloqueados (candado/disabled); asume plan starter en BD                      |
| `tests/e2e/agents-with-attachments.authenticated.spec.ts`             | Chat de agentes con adjuntos (subida, listado en hilo; requiere créditos para respuesta completa)                         |
| `tests/e2e/phase-02.authenticated.spec.ts` … `phase-07.authenticated.spec.ts` | Cobertura por fase con sesión (según proyecto de prueba)                                                          |
| `tests/e2e/billing.authenticated.spec.ts`                             | Billing / Stripe (si está habilitado en el entorno)                                                                      |

Listado de archivos en repo: `tests/e2e/*.spec.ts` (puede crecer; esta tabla es orientativa).

## Flujos autenticados

Los tests autenticados están en archivos `*.authenticated.spec.ts`. Para ejecutarlos:

1. Crear un usuario de prueba en Supabase (registro normal).
2. Completar onboarding para que tenga al menos un proyecto.
3. Añadir a `.env.local` (o exportar):
   ```
   TEST_USER_EMAIL=tu-usuario-prueba@ejemplo.com
   TEST_USER_PASSWORD=tu-password
   ```
4. Ejecutar: `pnpm test:e2e`

El proyecto `setup` hace login y guarda la sesión; el proyecto `chromium-authenticated` usa esa sesión. Si las credenciales no están definidas, el setup falla y los tests autenticados no se ejecutan (el resto sigue funcionando).

## Chat y créditos

Los tests de agents.authenticated.spec.ts incluyen envío de mensajes al chat. Para que el flujo completo (respuesta + guardar artifact) pase, se requiere:

- `ANTHROPIC_API_KEY` válida con créditos
- Usuario autenticado
- Proyecto existente

Sin créditos, el test "create conversation, see chat input and send message" pasa (verifica que el mensaje del usuario se muestra). El test "full flow" requiere respuesta de la IA.

## Smoke test en staging (TASK-176)

Para ejecutar el smoke contra **staging** en lugar de localhost:

```bash
BASE_URL=https://tu-staging.vercel.app TEST_USER_EMAIL=... TEST_USER_PASSWORD=... pnpm test:e2e tests/e2e/smoke-staging.authenticated.spec.ts
```

El runbook completo (checklist manual + criterios) está en `docs/05-qa/smoke-staging-phase00-phase01.md`.
