# ADR-001: Stack Tecnologico para MVP

**Status:** Accepted
**Fecha:** 2026-03-08
**Contexto:** Seleccion del stack para el MVP de Tribux AI

---

## Decision

Usar **Next.js (App Router) + TypeScript + Supabase + Vercel + Tailwind/shadcn/ui** como stack del MVP. **Versión en repo (2026):** Next.js 16.x; la decisión sigue siendo App Router + ecosistema Vercel.

## Contexto

Se necesita un stack que permita:

1. Desarrollo rapido de un SaaS con auth, DB y real-time
2. SSR para performance y SEO
3. Streaming de respuestas del LLM
4. Deploy zero-config con previews por PR
5. Un solo equipo (Tribux AI) pueda mantener frontend + backend

## Opciones Evaluadas

| Criterio               | Next.js + Supabase + Vercel | Remix + Prisma + Railway | SvelteKit + PocketBase |
| ---------------------- | --------------------------- | ------------------------ | ---------------------- |
| Auth integrado         | ✓ (Supabase Auth)           | Parcial (manual)         | Parcial                |
| RLS nativo             | ✓ (PostgreSQL)              | ✗                        | ✗                      |
| Streaming SSE          | ✓ (Vercel AI SDK)           | ✓ (manual)               | ✓ (manual)             |
| Deploy + previews      | ✓ (Vercel)                  | ✓ (Railway)              | Parcial                |
| Ecosistema componentes | ✓ (shadcn/ui)               | Parcial                  | Limitado               |
| Storage integrado      | ✓ (Supabase Storage)        | ✗ (S3 manual)            | ✓ (PocketBase)         |
| Madurez y comunidad    | Alta                        | Media                    | Media                  |

## Justificacion

- **Next.js (App Router):** Server Components eliminan waterfall de datos, App Router da estructura clara; Vercel AI SDK da streaming out-of-the-box.
- **Supabase**: Auth + DB + Storage + RLS en un solo servicio. Elimina la necesidad de configurar auth custom, S3, y middleware de seguridad. Free tier generoso para MVP.
- **Vercel**: Deploy automatico desde GitHub, previews por PR, Edge Network global, zero-config para Next.js.
- **Tailwind + shadcn/ui**: Componentes accesibles, themeable y copiados (no instalados), evitando lock-in a libreria de UI.
- **TypeScript strict**: Previene errores en runtime, mejora DX con autocompletado, documenta contratos de API.

## Consecuencias

**Positivas:**

- Time-to-market rapido — auth, DB y deploy resueltos desde dia 1
- Unica fuente de verdad para seguridad (RLS en Supabase)
- Streaming nativo para UX de chat con LLM

**Negativas/Riesgos:**

- Vendor lock-in parcial con Vercel (mitigable: Next.js es open source, desplegable en otros hosts)
- Supabase como punto unico de falla para DB + Auth + Storage (mitigable: backups automaticos, plan Pro con SLA)
- shadcn/ui componentes son copy-paste, no actualizables automaticamente (mitigable: bajo churn en componentes base)

---

## Seguimiento (marzo 2026)

- El repositorio corre hoy **Next.js 16.x** (App Router), **React 19** y **Tailwind 4**. La decision del ADR (Next + App Router + Vercel + Supabase + shadcn) se mantiene; solo cambia la version menor/mayor del framework en el codigo.
- Documentacion operativa del estado actual: `docs/ESTADO-DEL-PRODUCTO.md`.
