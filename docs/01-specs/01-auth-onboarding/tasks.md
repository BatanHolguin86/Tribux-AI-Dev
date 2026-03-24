# Tasks: Auth & Onboarding

**Feature:** 01 — Auth & Onboarding
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-05
**Status:** v1.0 — Implementado

**Alineación código (marzo 2026):** Ver `docs/ESTADO-DEL-PRODUCTO.md`. Rate limiting en auth: comprobar rutas reales en `src/app/api/auth/` (el spec histórico menciona paths que pueden diferir).

---

## Checklist de Implementacion

### Setup & Infraestructura

- [x] **TASK-001:** Crear proyecto en Supabase (staging + produccion)
- [x] **TASK-002:** Configurar variables de entorno — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] **TASK-003:** Instalar dependencias — `@supabase/ssr`, `@supabase/supabase-js`, `react-hook-form`, `zod`, `@hookform/resolvers`
- [x] **TASK-004:** Configurar cliente Supabase para server components (`src/lib/supabase/server.ts`) y client components (`src/lib/supabase/client.ts`)
- [x] **TASK-005:** Crear `middleware.ts` en raiz del proyecto para proteccion de rutas y refresh de sesion

### Base de Datos

- [x] **TASK-006:** Crear migracion `001_create_user_profiles.sql` — tabla `user_profiles` con RLS
- [x] **TASK-007:** Crear migracion `002_create_projects.sql` — tabla `projects` con RLS
- [x] **TASK-008:** Crear trigger `handle_new_user` para auto-crear `user_profile` al registrarse
- [x] **TASK-009:** Habilitar Google OAuth en Supabase Dashboard (configurar Client ID y Secret)
- [x] **TASK-010:** Configurar templates de email en Supabase (confirmacion de cuenta + reset de contrasena)

### Auth — Backend

- [x] **TASK-011:** Crear `POST /api/onboarding/complete` — guarda persona + crea primer proyecto + marca onboarding como completado
- [x] **TASK-012:** Crear `PATCH /api/onboarding/step` — actualiza `onboarding_step` en user_profiles
- [x] **TASK-013:** Crear schemas Zod en `src/lib/validations/auth.ts` — register, login, forgot-password, reset-password
- [x] **TASK-014:** Crear schema Zod en `src/lib/validations/onboarding.ts` — persona, proyecto
- [x] **TASK-014b:** Crear API routes con rate limiting — `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/forgot-password` (5 intentos/15min login/register, 3 intentos/15min forgot-password)

### Auth — Frontend

- [x] **TASK-015:** Crear layout de auth `src/app/(auth)/layout.tsx` — split design (valor prop izquierda, formulario derecha)
- [x] **TASK-016:** Crear pagina `/login` con formulario email+password + boton Google OAuth + link a register y forgot-password
- [x] **TASK-017:** Crear pagina `/register` con formulario email+password + boton Google OAuth + link a login
- [x] **TASK-018:** Crear pagina `/forgot-password` con formulario de email
- [x] **TASK-019:** Crear pagina `/auth/reset-password` con formulario de nueva contrasena
- [x] **TASK-020:** Crear pagina `/auth/callback` — maneja el redirect OAuth de Supabase y redirige a `/onboarding` o `/dashboard`
- [ ] **TASK-021:** Crear componente `AuthForm` reutilizable con React Hook Form + Zod + estados de loading/error/success
- [x] **TASK-022:** Crear componente `OAuthButton` (Google) con manejo de loading y error

### Onboarding — Frontend

- [x] **TASK-023:** Crear pagina `/onboarding` con layout de 4 pasos y barra de progreso
- [x] **TASK-024:** Crear componente `OnboardingStep1` — pantalla de bienvenida con intro a AI Squad e IA DLC
- [x] **TASK-025:** Crear componente `OnboardingStep2` — selector de persona (4 cards: Founder, PM, Consultor, Emprendedor)
- [x] **TASK-026:** Crear componente `OnboardingStep3` — formulario de primer proyecto (nombre, descripcion, industria)
- [x] **TASK-027:** Crear componente `OnboardingStep4` — timeline visual de las 8 fases IA DLC con animacion
- [x] **TASK-028:** Implementar logica de navegacion entre pasos (atras, siguiente, omitir) con persistencia de estado en DB via `PATCH /api/onboarding/step`
- [x] **TASK-029:** Al completar paso 4, llamar a `POST /api/onboarding/complete` y redirigir a `/projects/:id/phase/00`
- [x] **TASK-030:** Implementar guard en `/onboarding` — si `onboarding_completed = true`, redirigir a `/dashboard`

### Tipos TypeScript

- [x] **TASK-031:** Crear `src/types/user.ts` — tipos `UserProfile`, `Persona`
- [x] **TASK-032:** Crear `src/types/project.ts` — tipos `Project`, `ProjectStatus`

### Tests

- [x] **TASK-033:** Tests unitarios para schemas Zod de auth y onboarding (`tests/unit/validations/auth.test.ts`)
- [x] **TASK-033b:** Tests unitarios para rate limiter (`tests/unit/lib/rate-limit.test.ts`)
- [ ] **TASK-034:** Test E2E — flujo completo registro con email → confirmacion → login → onboarding → dashboard _(parcial: `tests/e2e/auth.spec.ts` valida carga de login/register/forgot-password; no cubre confirmación de email ni onboarding end-to-end)_
- [ ] **TASK-035:** Test E2E — flujo login con Google OAuth (`tests/e2e/oauth.spec.ts`)
- [ ] **TASK-036:** Test E2E — flujo forgot password → reset (`tests/e2e/password-reset.spec.ts`)

### Alineacion v1.0 KIRO

- [x] **TASK-530:** Revisar `requirements.md` de Auth & Onboarding — v1.0 incluye happy path solido de registro/login/onboarding + rate limiting
- [ ] **TASK-531:** Crear o actualizar `design.md` de Auth & Onboarding con los flujos reales
- [x] **TASK-532:** Completar y ajustar este `tasks.md` con tareas v1.0 y backlog posterior
- [x] **TASK-533:** Verificar y ajustar en el codigo las redirecciones y guards para que el flujo real coincida con el spec

### Deploy & Variables de Entorno

- [x] **TASK-037:** Configurar variables de entorno en Vercel (staging y produccion)
- [x] **TASK-038:** Configurar URLs de redirect OAuth en Supabase para staging (`*.vercel.app`) y produccion
- [x] **TASK-039:** Aplicar migraciones en base de datos de staging
- [ ] **TASK-040:** Smoke test de flujo completo en staging antes de merge a main

---

## Orden de Ejecucion Sugerido

```
Semana 1: TASK-001 → 014 (Setup + DB + Backend) ✓
Semana 2: TASK-015 → 022 (Auth Frontend) ✓
Semana 3: TASK-023 → 032 (Onboarding + Tipos) ✓
Semana 4: TASK-033 → 040 (Tests + Deploy) ~90%
```

---

## Definition of Done — Feature 01

- [x] Registro con email y Google OAuth funcional
- [x] Login con email y Google OAuth funcional
- [x] Recuperacion de contrasena funcional
- [x] Onboarding de 4 pasos completado con persistencia
- [x] Primer proyecto creado al finalizar onboarding
- [x] Usuario llega a Phase 00 de su proyecto al terminar
- [x] Rutas protegidas redirigen a /login si no autenticado
- [x] RLS habilitado en `user_profiles` y `projects`
- [ ] Tests E2E pasando en staging
- [x] Deploy en Vercel sin errores
