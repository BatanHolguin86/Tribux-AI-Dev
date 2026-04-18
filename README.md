# Tribux AI

Metodología **IA DLC** (AI-Driven Development Lifecycle): del discovery al lanzamiento, con KIRO specs y agentes especializados.

## Inicio rápido

```bash
pnpm install
cp .env.example .env.local   # completar variables
pnpm dev
```

- **Documentación del producto y del repo:** [`docs/README.md`](./docs/README.md)
- **Estado actual vs código (2026):** [`docs/ESTADO-DEL-PRODUCTO.md`](./docs/ESTADO-DEL-PRODUCTO.md) · roadmap v1 [`docs/00-discovery/estatus-v1-y-roadmap.md`](./docs/00-discovery/estatus-v1-y-roadmap.md)
- **Orquestación / convenciones para IA:** [`CLAUDE.md`](./CLAUDE.md)

## Comandos útiles

| Comando                            | Uso                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`                         | Servidor de desarrollo                                                 |
| `pnpm build` / `pnpm start`        | Build y producción local                                               |
| `pnpm test` / `pnpm test:e2e`      | Vitest y Playwright                                                    |
| `pnpm run plan:enterprise <email>` | Asignar plan enterprise en dev (requiere service role en `.env.local`) |

## Infraestructura

Migraciones y seed: `infrastructure/supabase/`. CI: `infrastructure/github/workflows/`.

**Release / producción:** variables, **todas** las migraciones numeradas en `infrastructure/supabase/migrations/` (la **021** es crítica para `item_states` en checklists), buckets y checklist en [`docs/06-ops/v1-release.md`](./docs/06-ops/v1-release.md).
