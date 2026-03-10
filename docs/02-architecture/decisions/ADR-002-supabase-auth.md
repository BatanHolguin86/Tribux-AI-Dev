# ADR-002: Autenticacion con Supabase Auth

**Status:** Accepted
**Fecha:** 2026-03-08
**Contexto:** Definicion de la estrategia de autenticacion para el producto

---

## Decision

Usar **Supabase Auth** como unico proveedor de autenticacion, con email/password y Google OAuth como metodos de login.

## Contexto

El MVP requiere:

- Registro e inicio de sesion seguros
- OAuth (minimo Google) para onboarding rapido
- Recuperacion de contrasena
- Sesiones persistentes (7+ dias)
- Proteccion de rutas server-side
- RLS en la base de datos ligado a la identidad del usuario

## Opciones Evaluadas


| Criterio               | Supabase Auth     | NextAuth.js | Clerk  | Auth0  |
| ---------------------- | ----------------- | ----------- | ------ | ------ |
| Integrado con DB (RLS) | ✓                 | ✗           | ✗      | ✗      |
| OAuth providers        | ✓                 | ✓           | ✓      | ✓      |
| Email templates        | ✓                 | Manual      | ✓      | ✓      |
| Precio MVP             | $0                | $0          | $25/mo | $23/mo |
| SSR support            | ✓ (@supabase/ssr) | ✓           | ✓      | ✓      |
| Complejidad setup      | Baja              | Media       | Baja   | Media  |


## Justificacion

Supabase Auth es la opcion natural dado que ya usamos Supabase para DB y Storage. La integracion es nativa: `auth.uid()` en RLS policies, triggers on `auth.users`, JWT tokens gestionados automaticamente. Agregar otro proveedor de auth implicaria sincronizar identidades entre dos sistemas.

## Implementacion

- `@supabase/ssr` para manejo de sesion en Server Components y Route Handlers
- `middleware.ts` de Next.js verifica JWT en cada request a rutas protegidas
- Cookies `HttpOnly` + `SameSite=Lax` para tokens (gestionado por Supabase SSR)
- Google OAuth configurado en Supabase Dashboard
- Email templates personalizadas en Supabase para confirmacion y reset

## Consecuencias

**Positivas:**

- Auth y DB en el mismo servicio = RLS directo con `auth.uid()`
- Zero custom auth code — Supabase maneja tokens, refresh, OAuth flow
- Email templates configurables sin servicio externo para auth emails

**Negativas/Riesgos:**

- Lock-in con Supabase Auth (mitigable: JWT estandar, migracion posible a cualquier IdP)
- Limite de 50,000 MAU en free tier (suficiente para MVP, Supabase Pro si escala)

