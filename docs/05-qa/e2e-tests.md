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
| `tests/e2e/auth.setup.ts` | Setup: login y guardado de sesión (requiere credenciales) |
| `tests/e2e/auth.spec.ts` | Login, registro, forgot-password; páginas cargan y muestran formularios |
| `tests/e2e/protected-routes.spec.ts` | Redirección a login cuando no hay sesión |
| `tests/e2e/phase-00.spec.ts` | Phase 00: redirect sin auth |
| `tests/e2e/phase-00.authenticated.spec.ts` | Phase 00 con sesión: carga y muestra chat input |

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

Los tests no envían mensajes al chat. Para probar Phase 00/01 con IA real, se requiere:

- `ANTHROPIC_API_KEY` válida con créditos
- Usuario autenticado
- Proyecto existente
