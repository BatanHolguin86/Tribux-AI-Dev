# Tests E2E — AI Squad Command Center

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

| Archivo | Cobertura |
|---------|-----------|
| `tests/e2e/auth.spec.ts` | Login, registro, forgot-password; páginas cargan y muestran formularios |
| `tests/e2e/protected-routes.spec.ts` | Redirección a login cuando no hay sesión (dashboard, phases, agents, onboarding) |
| `tests/e2e/phase-00.spec.ts` | Phase 00: redirect sin auth; test skip para flujo autenticado |

## Flujos autenticados

Los tests que requieren sesión están con `test.skip`. Para ejecutarlos:

1. Crear un usuario de prueba en Supabase.
2. Ejecutar un flujo de login y guardar `storageState` (ver [Playwright Auth](https://playwright.dev/docs/auth)).
3. Ejecutar tests con `storageState` en la config.

## Chat y créditos

Los tests no envían mensajes al chat. Para probar Phase 00/01 con IA real, se requiere:

- `ANTHROPIC_API_KEY` válida con créditos
- Usuario autenticado
- Proyecto existente
