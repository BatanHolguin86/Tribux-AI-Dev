# Release v1.0 — alcance, despliegue y limitaciones

Documento operativo para **Fase D** del roadmap (`[docs/00-discovery/estatus-v1-y-roadmap.md](../00-discovery/estatus-v1-y-roadmap.md)`): qué significa v1.0 en este repo, qué desplegar y cómo verificar antes de producción.

---

## 1. Definición de v1.0 (alcance)

**v1.0** aquí significa: producto usable de punta a punta para el flujo **IA DLC** en la app (Next.js + Supabase), con diseño (00–02) y esqueleto operativo de construcción y lanzamiento (03–07), sin pretender automatizar todo el trabajo externo (CI, consola de Vercel/Supabase, etc.).


| Incluido en alcance v1.0                                  | Fuera o parcial                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Auth, proyectos, fases 00–01, agentes con adjuntos        | Integraciones de terceros más allá de las ya cableadas (Stripe opcional, etc.) |
| Hub Diseño & UX (artefactos, aprobación → Phase 04)       | “Un clic deploy” desde la app                                                  |
| Checklists/Kanban persistidos 03–07 + narrativa de cierre | Sincronización automática con pipelines externos                               |
| Documentación QA/E2E y go/no-go                           | SLA de soporte o multi-tenant enterprise no documentado aquí                   |


Detalle vivo del producto: `[docs/ESTADO-DEL-PRODUCTO.md](../ESTADO-DEL-PRODUCTO.md)`.

**Limitaciones conocidas (resumen):**

- Requiere **ANTHROPIC_API_KEY** y proyecto Supabase correctamente migrado; sin ello, partes de la app degradan con mensajes de error, no con datos ficticios.
- Buckets de Storage deben existir en el proyecto Supabase si se usan uploads (ver §3).
- Billing Stripe es **opcional** según variables de entorno.

---

## 2. Requisitos de despliegue

### 2.1 Variables de entorno (Vercel / hosting)

Tomar como referencia **completa** el archivo `**.env.example`** en la raíz del repo. Mínimo habitual para producción:

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; secret).
- **IA:** `ANTHROPIC_API_KEY`.
- **App:** `NEXT_PUBLIC_APP_URL` (URL pública del despliegue).
- **Emails (si aplica):** `RESEND_API_KEY`.
- **Sentry (si aplica):** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` para releases/source maps según `[sentry-setup.md](./sentry-setup.md)`.
- **Stripe:** solo si habilitáis cobros; ver comentarios en `.env.example`.

Nunca commitear `.env.local` ni secretos.

### 2.2 Base de datos — migraciones

Aplicar **todas** las migraciones bajo `infrastructure/supabase/migrations/` al proyecto de Supabase de **staging** y luego **producción**, en orden (CLI `supabase db push`, o SQL Editor copiando cada archivo).

**Importante para checklists por ítem:** la migración `**021_phase_sections_item_states.sql`** añade la columna `item_states` (jsonb) en `phase_sections`. Sin ella, los endpoints que persisten ítems fallarán.

Tras el **021**, el repo sigue acumulando cambios (integraciones, Stripe, costes/infra, etc.). Aplicar **hasta la última migración numerada** en `infrastructure/supabase/migrations/` (p. ej. **033** o superior según el branch).

El archivo `[scripts/pending-migrations.sql](../../scripts/pending-migrations.sql)` es un **resumen histórico/manual** y puede quedar desfasado; la fuente de verdad para operadores es la **carpeta `migrations/`** en orden ascendente.

Guía histórica staging (ejemplo de flujo): `[apply-migrations-staging.md](./apply-migrations-staging.md)`.

### 2.3 Supabase Storage — buckets

Según specs implementadas:

- `**project-documents**` — documentos/specs por proyecto (privado; acceso vía servidor / signed URLs).
- `**project-chat**` — adjuntos en hilos de agentes (`src/lib/storage/chat-attachments.ts`).
- `**project-designs**` — artefactos de diseño (privado; uso best-effort si en un entorno aún no existe el bucket).

Crearlos en el dashboard de Supabase con políticas acordes a RLS/privacidad (ver tareas en `docs/01-specs/` Phase 00 y UI/UX design generator).

---

## 3. Checklist antes de “lanzar”

1. `**pnpm test**` y `**pnpm build**` en CI o local sobre la rama de release.
2. E2E opcional pero recomendado: `**pnpm test:e2e**` con credenciales de test configuradas (ver `[docs/05-qa/v1-go-no-go.md](../05-qa/v1-go-no-go.md)`).
3. Variables de entorno revisadas en Vercel (o host equivalente).
4. Migraciones aplicadas; verificar que `phase_sections` tenga `**item_states**` si usáis fases 03/05/06/07 con ítems.
5. Buckets creados si usáis upload de documentos o diseños.
6. Recorrer **go/no-go** con un usuario de prueba (`[v1-go-no-go.md](../05-qa/v1-go-no-go.md)`).

---

## 4. Referencias


| Documento                                                  | Uso                              |
| ---------------------------------------------------------- | -------------------------------- |
| `[docs/05-qa/v1-go-no-go.md](../05-qa/v1-go-no-go.md)`     | Criterios y registro de revisión |
| `[docs/ESTADO-DEL-PRODUCTO.md](../ESTADO-DEL-PRODUCTO.md)` | Estado funcional vs código       |
| `[docs/README.md](../README.md)`                           | Índice de documentación          |
| `[CLAUDE.md](../../CLAUDE.md)`                             | Convenciones y stack             |


