# Sentry Setup — Tribux

## 1. Crear proyecto en Sentry

1. Ve a [sentry.io](https://sentry.io) y crea una cuenta o inicia sesion
2. Crea un nuevo proyecto:
   - Platform: **Next.js**
   - Project name: `ai-squad-command-center`
3. Copia el **DSN** que te da Sentry (formato: `https://xxxxx@oXXXXX.ingest.sentry.io/XXXXX`)

## 2. Configurar variables de entorno

### Local (.env.local)

```
NEXT_PUBLIC_SENTRY_DSN=https://tu-dsn-aqui@oXXXXX.ingest.sentry.io/XXXXX
SENTRY_AUTH_TOKEN=sntrys_tu-token-aqui
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=ai-squad-command-center
```

### Vercel (Production)

En Vercel Dashboard > Settings > Environment Variables, agrega:

- `NEXT_PUBLIC_SENTRY_DSN` — el DSN de Sentry
- `SENTRY_AUTH_TOKEN` — token de autenticacion (Settings > Auth Tokens)
- `SENTRY_ORG` — nombre de tu organizacion en Sentry
- `SENTRY_PROJECT` — `ai-squad-command-center`

## 3. Verificar

Despues de hacer deploy:

1. Abre la app en produccion
2. Abre la consola del navegador y escribe: `throw new Error('Test Sentry')`
3. Ve a Sentry Dashboard > Issues — deberia aparecer el error

## Archivos de configuracion

Ya creados en el proyecto:

- `sentry.client.config.ts` — Init del SDK en el browser
- `sentry.server.config.ts` — Init del SDK en Node.js server
- `sentry.edge.config.ts` — Init del SDK en Edge Runtime
- `next.config.ts` — `withSentryConfig` wrapper con source maps

## Configuracion actual

- **tracesSampleRate:** 0.1 (10% de requests trackeados)
- **replaysOnErrorSampleRate:** 1.0 (100% de sesiones con error grabadas)
- **enabled:** solo en `production`
- **sourcemaps:** auto-upload y auto-delete despues del build
