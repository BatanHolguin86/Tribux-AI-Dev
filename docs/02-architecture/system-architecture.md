# System Architecture — AI Squad Command Center

**Phase:** 02 — Architecture & Design
**Fecha:** 2026-03-08
**Status:** Pendiente aprobacion CEO/CPO

---

## 1. Diagrama de Arquitectura de Alto Nivel

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            USUARIO (Browser)                                  │
│                                                                              │
│  Next.js Client                                                              │
│  ├── React 19 (Server Components + Client Components)                       │
│  ├── Zustand (client state: phases, features, agents)                       │
│  ├── React Query / SWR (server state cache)                                 │
│  ├── Vercel AI SDK useChat (streaming UI)                                   │
│  └── shadcn/ui + Tailwind CSS (design system)                               │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │ HTTPS (TLS 1.3)
                                │
┌───────────────────────────────▼──────────────────────────────────────────────┐
│                        VERCEL (Edge Network + Serverless)                     │
│                                                                              │
│  Next.js 16 App Router                                                       │
│  ├── Middleware (auth guard, redirects, rate limiting headers)               │
│  ├── Server Components (SSR: dashboard, phases, workspace por fase)         │
│  ├── Route Handlers (API):                                                  │
│  │   ├── /api/onboarding/*        POST, PATCH                              │
│  │   ├── /api/projects/*          GET, POST, PATCH                          │
│  │   ├── /api/projects/[id]/phases/*                                        │
│  │   │   ├── /0/chat              POST (streaming)                          │
│  │   │   ├── /0/sections/*/approve POST                                     │
│  │   │   ├── /1/features/*        GET, POST, PATCH, DELETE                  │
│  │   │   └── /1/features/*/chat   POST (streaming)                          │
│  │   ├── /api/projects/[id]/agents/*/threads/*/chat  POST (streaming)       │
│  │   ├── /api/projects/[id]/documents/*  GET, PATCH                         │
│  │   ├── /api/projects/[id]/designs/*    GET, POST, PATCH                   │
│  │   └── /api/projects/[id]/artifacts    POST                               │
│  └── Static Assets (optimized by Vercel CDN)                                │
│                                                                              │
└──────┬───────────────┬─────────────────┬──────────────────┬─────────────────┘
       │               │                 │                  │
       ▼               ▼                 ▼                  ▼
┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  SUPABASE   │ │  ANTHROPIC   │ │   RESEND     │ │  SENTRY      │
│             │ │  Claude API  │ │              │ │              │
│ PostgreSQL  │ │              │ │  Emails      │ │  Error       │
│ ├─ RLS     │ │ claude-      │ │  transacc.   │ │  tracking    │
│ ├─ Triggers│ │ sonnet-4-6   │ │  ├─ Confirm  │ │  ├─ Frontend │
│ Auth        │ │              │ │  ├─ Reset    │ │  └─ Backend  │
│ ├─ JWT     │ │ Streaming    │ │  └─ Weekly   │ │              │
│ ├─ OAuth   │ │ via Vercel   │ │    summary   │ │              │
│ ├─ Refresh │ │ AI SDK       │ │              │ │              │
│ Storage     │ │              │ │              │ │              │
│ ├─ Docs    │ │ Max context: │ │              │ │              │
│ ├─ Designs │ │ 100K tokens  │ │              │ │              │
│ └─ Artifacts│ │              │ │              │ │              │
└─────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 2. Flujo de Datos por Feature

### 2.1 Auth Flow

```
Browser                    Vercel Middleware        Supabase Auth
  │                              │                       │
  ├─ POST /register ────────────►│                       │
  │                              ├─ supabase.auth.signUp()──►│
  │                              │                       ├─ Insert auth.users
  │                              │                       ├─ Trigger: handle_new_user()
  │                              │                       │   └─ Insert user_profiles
  │                              │                       ├─ Send confirmation email
  │◄─── Redirect /login ────────┤                       │
  │                              │                       │
  ├─ POST /login ───────────────►│                       │
  │                              ├─ supabase.auth.signIn()──►│
  │                              │                       ├─ Return JWT + refresh token
  │◄─── Set cookies + redirect ──┤                       │
  │     to /dashboard or         │                       │
  │     /onboarding              │                       │
```

### 2.2 Phase Chat Flow (Phase 00, 01, Agents)

```
Browser (useChat)          Route Handler              Anthropic API
  │                              │                       │
  ├─ POST /api/.../chat ────────►│                       │
  │   { message, section }       │                       │
  │                              ├─ Verify auth (JWT)    │
  │                              ├─ Load project context │
  │                              ├─ Load conversation    │
  │                              │   history from DB     │
  │                              ├─ Build system prompt  │
  │                              ├─ streamText() ───────►│
  │                              │                       ├─ Generate tokens
  │◄─── SSE stream ─────────────┤◄── Token stream ──────┤
  │     (token by token)         │                       │
  │                              │                       │
  │  onFinish:                   │                       │
  │  ├─ Persist user msg to DB   │                       │
  │  └─ Persist assistant msg    │                       │
```

### 2.3 Document Generation Flow

```
Browser                    Route Handler              Anthropic API      Supabase Storage
  │                              │                       │                    │
  ├─ POST /.../generate ────────►│                       │                    │
  │                              ├─ Load full section    │                    │
  │                              │   conversation        │                    │
  │                              ├─ streamText() ───────►│                    │
  │◄─── SSE (doc chunks) ───────┤◄── Token stream ──────┤                    │
  │                              │                       │                    │
  │                              │  onFinish:            │                    │
  │                              │  ├─ Upload markdown ──────────────────────►│
  │                              │  ├─ Upsert project_documents               │
  │                              │  └─ Return doc metadata                    │
```

### 2.4 Design Generation Flow (UI/UX)

```
Browser                    Route Handler              LLM / Renderer     Supabase Storage
  │                              │                       │                    │
  ├─ POST /.../designs/generate─►│                       │                    │
  │   { type, screens, refine }  │                       │                    │
  │                              ├─ Create design_artifacts                   │
  │                              │   (status: generating) │                    │
  │◄─── 202 Accepted ───────────┤                       │                    │
  │                              │                       │                    │
  │                              ├─ Background job:      │                    │
  │                              │  ├─ Build prompt with  │                    │
  │                              │  │  design.md context  │                    │
  │                              │  ├─ Generate SVG/HTML ►│                    │
  │                              │  ├─ Render to PNG      │                    │
  │                              │  ├─ Upload to Storage ────────────────────►│
  │                              │  └─ Update status → draft                  │
  │                              │                       │                    │
  │  (polling or realtime)       │                       │                    │
  ├─ GET /.../designs ──────────►│                       │                    │
  │◄─── Artifacts with status ───┤                       │                    │
```

---

## 3. Capas de la Aplicacion

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                           │
│                                                                  │
│  Server Components    Client Components    Shared Components     │
│  ├─ page.tsx          ├─ ChatPanel         ├─ ChatHistory        │
│  ├─ layout.tsx        ├─ Phase00Layout     ├─ ChatMessage        │
│  └─ loading.tsx       ├─ Phase01Layout     ├─ ChatInput          │
│                       ├─ AgentsLayout      ├─ DocumentPanel      │
│                       ├─ FeatureList       ├─ DocumentViewer     │
│                       └─ DesignGallery     ├─ DocumentEditor     │
│                                            └─ ApprovalGate       │
├──────────────────────────────────────────────────────────────────┤
│                      STATE MANAGEMENT                            │
│                                                                  │
│  Zustand Stores               React Query / SWR                  │
│  ├─ phase-00-store.ts         ├─ useProjects()                  │
│  ├─ phase-01-store.ts         ├─ useProjectPhases()             │
│  └─ agents-store.ts           ├─ useFeatures()                  │
│                               ├─ useThreads()                   │
│  Vercel AI SDK                └─ useDesigns()                   │
│  └─ useChat() per panel                                         │
├──────────────────────────────────────────────────────────────────┤
│                       API LAYER                                  │
│                                                                  │
│  Route Handlers (src/app/api/)                                   │
│  ├─ Auth: /api/onboarding/*                                     │
│  ├─ Projects: /api/projects/*                                   │
│  ├─ Phases: /api/projects/[id]/phases/*                         │
│  ├─ Features: /api/projects/[id]/phases/1/features/*            │
│  ├─ Agents: /api/projects/[id]/agents/*                         │
│  ├─ Documents: /api/projects/[id]/documents/*                   │
│  ├─ Designs: /api/projects/[id]/designs/*                       │
│  └─ Artifacts: /api/projects/[id]/artifacts                     │
├──────────────────────────────────────────────────────────────────┤
│                     BUSINESS LOGIC                               │
│                                                                  │
│  AI Module (src/lib/ai/)                                        │
│  ├─ anthropic.ts          — AI provider config                  │
│  ├─ context-builder.ts    — Build project context for LLM       │
│  ├─ title-generator.ts    — Auto-generate thread titles         │
│  ├─ prompts/                                                    │
│  │   ├─ phase-00.ts       — Phase 00 section prompts            │
│  │   ├─ phase-01.ts       — KIRO document prompts               │
│  │   └─ feature-suggestions.ts                                  │
│  └─ agents/                                                     │
│      ├─ index.ts           — Agent registry (8 agents)          │
│      ├─ cto-virtual.ts                                          │
│      ├─ product-architect.ts                                    │
│      ├─ system-architect.ts                                     │
│      ├─ ui-ux-designer.ts                                       │
│      ├─ lead-developer.ts                                       │
│      ├─ db-admin.ts                                             │
│      ├─ qa-engineer.ts                                          │
│      ├─ devops-engineer.ts                                      │
│      └─ prompt-builder.ts                                       │
│                                                                  │
│  Validations (src/lib/validations/)                              │
│  ├─ auth.ts, projects.ts, features.ts, designs.ts              │
│  └─ Zod schemas for all API inputs                              │
│                                                                  │
│  Storage (src/lib/storage/)                                      │
│  └─ documents.ts — upload, get, getSignedUrl                    │
├──────────────────────────────────────────────────────────────────┤
│                     DATA ACCESS LAYER                            │
│                                                                  │
│  Supabase Client (src/lib/supabase/)                            │
│  ├─ server.ts    — createServerClient (SSR, Route Handlers)     │
│  ├─ client.ts    — createBrowserClient (Client Components)      │
│  └─ middleware.ts — createMiddlewareClient (auth guard)          │
│                                                                  │
│  Database: PostgreSQL (Supabase) with RLS on all tables          │
│  Storage: Supabase Storage (private buckets)                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Seguridad — Modelo en Profundidad

### 4.1 Capas de Seguridad

```
Layer 1: NETWORK
├─ Vercel Edge Network (DDoS protection, TLS 1.3)
├─ HTTPS everywhere (forced redirect)
└─ HSTS headers

Layer 2: APPLICATION (Next.js Middleware)
├─ Auth guard: verify JWT on every protected route
├─ Redirect unauthenticated users to /login
├─ Rate limiting headers (X-RateLimit-*)
└─ CSRF protection via SameSite cookies

Layer 3: API (Route Handlers)
├─ Zod validation on ALL request bodies
├─ Auth verification on every handler
├─ Input sanitization before LLM (strip injection patterns)
├─ Rate limiting: 5 auth attempts / 15 min / IP
├─ Rate limiting: 30 agent messages / min / user
└─ Never expose internal errors (generic error messages)

Layer 4: DATABASE (Supabase RLS)
├─ RLS enabled on ALL tables
├─ Policies: user can only access own data
├─ service_role key NEVER on client
├─ Parameterized queries (no SQL injection)
└─ Audit columns (created_at, updated_at) on all tables

Layer 5: EXTERNAL SERVICES
├─ Anthropic API key: server-side only (ANTHROPIC_API_KEY)
├─ Supabase keys: SUPABASE_URL (public), SUPABASE_ANON_KEY (public),
│  SUPABASE_SERVICE_ROLE_KEY (server-only)
├─ Resend API key: server-side only
└─ Sentry DSN: public (client-side error tracking only)
```

### 4.2 Variables de Entorno

```
# .env.local (NEVER committed)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # SERVER ONLY

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...               # SERVER ONLY

# Resend
RESEND_API_KEY=re_...                      # SERVER ONLY

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...         # Public (client tracking)
SENTRY_AUTH_TOKEN=sntrys_...               # SERVER ONLY (source maps)

# App
NEXT_PUBLIC_APP_URL=https://app.aisquad.com
```

---

## 5. Streaming Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │            Vercel AI SDK Flow                │
                    │                                             │
  Client            │   Route Handler          Anthropic API      │
  (useChat)         │                                             │
    │               │      │                       │              │
    ├─ POST ───────►│──────►│                       │              │
    │               │      │                       │              │
    │               │      ├─ streamText({         │              │
    │               │      │    model: anthropic   │              │
    │               │      │      ('claude-        │              │
    │               │      │       sonnet-4-6'),   │              │
    │               │      │    system: prompt,    │              │
    │               │      │    messages: [...],   │              │
    │               │      │    maxTokens: N,      │              │
    │               │      │  })                   │              │
    │               │      │                       │              │
    │               │      ├─ .toDataStream        │              │
    │               │      │  Response() ─────────►│              │
    │               │      │                       │              │
    │◄── SSE ───────│◄─────┤◄── Token stream ──────┤              │
    │  (real-time)  │      │                       │              │
    │               │      │                       │              │
    ├─ onFinish ───►│      │                       │              │
    │  (persist)    │      │                       │              │
    │               │                                             │
    └───────────────┴─────────────────────────────────────────────┘

Key config per use case:
┌────────────────────┬──────────────┬──────────────┐
│ Use Case           │ maxTokens    │ temperature  │
├────────────────────┼──────────────┼──────────────┤
│ Phase 00 chat      │ 4,096        │ 0.7          │
│ Phase 01 chat      │ 4,096        │ 0.7          │
│ Doc generation     │ 8,192        │ 0.5          │
│ Agent free chat    │ 4,096        │ 0.7          │
│ Thread title       │ 50           │ 0.3          │
│ Feature suggestions│ 2,048        │ 0.6          │
│ Design prompts     │ 4,096        │ 0.5          │
└────────────────────┴──────────────┴──────────────┘
```

---

## 6. Estrategia de Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT PIPELINE                         │
│                                                                  │
│  Developer                                                       │
│     │                                                            │
│     ├─ git push to feature branch                                │
│     │     │                                                      │
│     │     ▼                                                      │
│     │  GitHub Actions CI                                         │
│     │  ├─ pnpm install                                          │
│     │  ├─ tsc --noEmit (type check)                             │
│     │  ├─ eslint . (lint)                                       │
│     │  ├─ vitest run (unit tests)                               │
│     │  └─ next build (build check)                              │
│     │     │                                                      │
│     │     ▼  (if all pass)                                       │
│     │  Vercel Preview Deployment                                 │
│     │  └─ URL: feat-xxx.aisquad.vercel.app                      │
│     │                                                            │
│     ├─ PR merged to main                                         │
│     │     │                                                      │
│     │     ▼                                                      │
│     │  Vercel Production Deployment                              │
│     │  └─ URL: app.aisquad.com                                  │
│     │                                                            │
│     └─ Supabase Migrations                                       │
│           ├─ staging: manual apply before PR merge               │
│           └─ production: manual apply after deploy confirmed     │
│                                                                  │
│  Environments:                                                   │
│  ├─ Local:   localhost:3000 + Supabase local                    │
│  ├─ Staging: preview deployments + Supabase staging project     │
│  └─ Prod:    app.aisquad.com + Supabase production project      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Monitoring y Observabilidad

| Herramienta             | Que monitorea                                      | Alertas              |
| ----------------------- | -------------------------------------------------- | -------------------- |
| **Vercel Analytics**    | Web Vitals (LCP, FID, CLS), page views, speed      | LCP > 2.5s           |
| **Sentry**              | Errores JS (client + server), unhandled exceptions | Error rate > 1%      |
| **Supabase Dashboard**  | DB connections, query performance, storage usage   | DB connections > 80% |
| **Anthropic Dashboard** | Token usage, API errors, rate limits               | Monthly spend > $100 |
| **Custom logging**      | Phase completions, agent usage, feature adoption   | —                    |

---

## 8. Escalabilidad — Decisiones Clave

| Dimension              | Estrategia MVP                            | Limite estimado     | Plan de escalamiento      |
| ---------------------- | ----------------------------------------- | ------------------- | ------------------------- |
| **Users concurrentes** | Vercel serverless auto-scale              | ~10,000             | Vercel Pro plan           |
| **DB connections**     | Supabase connection pooler (PgBouncer)    | 10,000              | Supabase Pro              |
| **LLM requests**       | Anthropic API con rate limits             | ~1,000/min          | Anthropic Enterprise      |
| **Storage**            | Supabase Storage                          | 1GB free, 100GB pro | S3 migration si necesario |
| **Real-time**          | Supabase Realtime (design status polling) | 200 concurrent      | Supabase Pro              |
