# Product Requirements Document (PRD)
## AI Squad Command Center

**Version:** 1.0
**Fecha:** 2026-03-06
**Autor:** Orquestador IA — AI Squad
**Status:** Pendiente aprobacion CEO/CPO

---

## 1. Objetivo del Producto

AI Squad Command Center es una plataforma SaaS B2B que permite a personas sin experiencia tecnica construir productos digitales end-to-end, actuando como CEO/CPO de un equipo de agentes IA especializados que ejecuta la metodologia IA DLC (AI-Driven Development Lifecycle) de 8 fases.

**El problema que resuelve:** La brecha entre tener una idea de negocio clara y saber como construir el producto tecnologico que la materializa. Los usuarios llegan con vision; AI Squad les da el equipo, el proceso y la ejecucion.

**La promesa central:** Tu idea, tu decision. Nuestro equipo, nuestro proceso. Tu producto.

---

## 2. Contexto y Antecedentes

Ver documentos de Phase 00:
- `docs/discovery/brief.md` — Problem statement e hipotesis
- `docs/discovery/personas.md` — 4 perfiles de usuario
- `docs/discovery/competitive-analysis.md` — Landscape y gap
- `docs/discovery/value-proposition.md` — Propuesta de valor

**Resumen ejecutivo del contexto:**
El mercado esta fragmentado entre herramientas para tecnicos (que excluyen al usuario objetivo) y herramientas simplificadas que no escalan a productos complejos. Ninguna solucion combina metodologia estructurada + agentes IA especializados + control humano por fases a precio SaaS.

---

## 3. Usuarios Objetivo

| Persona | Perfil | Plan objetivo |
|---------|--------|---------------|
| Santiago — Founder no-tecnico | Early-stage, necesita MVP rapido | Builder ($299/mes) |
| Valentina — PM Senior | Empresa mediana, valida hipotesis | Builder ($299/mes) |
| Rodrigo — Consultor/Agency | Entrega productos a clientes | Agency ($699/mes) |
| Camila — Emprendedora digital | Primera idea, sin equipo | Starter ($149/mes) |

**Usuario primario del MVP:** Camila y Santiago — perfiles con mayor urgencia y caso de uso mas directo.

---

## 4. Alcance del Producto

### MVP (v1.0) — 5 Modulos Core

| # | Modulo | Descripcion |
|---|--------|-------------|
| M1 | Auth & Onboarding | Registro, login, perfil de usuario, creacion de primer proyecto |
| M2 | Project Dashboard | Vista y gestion de proyectos, estado de fases, navegacion |
| M3 | Phase 00 Interactivo | Flujo guiado de discovery con orquestador IA |
| M4 | Generador KIRO | Phase 01 interactivo — genera requirements, design y tasks |
| M5 | Orquestador + Agentes | Interfaz de chat con CTO Virtual y 6 agentes especializados |

### Fuera de Alcance MVP
- Phases 02–07 con interfaz guiada (el orquestador las apoya via chat libre)
- Multi-usuario por proyecto (colaboracion en equipo)
- Integraciones directas con GitHub, Vercel, Supabase (links manuales)
- Mobile app nativa
- White-label para agencias
- Marketplace de templates

---

## 5. User Flows Principales

### Flow 1: Primer uso — Registro a Phase 00

```
Landing page
    → CTA "Empieza gratis"
    → /register (email o Google)
    → Email de confirmacion (si aplica)
    → /onboarding (4 pasos)
        Paso 1: Bienvenida + que es AI Squad
        Paso 2: Seleccion de perfil (persona)
        Paso 3: Crear primer proyecto (nombre, descripcion, industria)
        Paso 4: Vision de las 8 fases IA DLC
    → /projects/:id/phase/00
        → Phase 00 interactivo con orquestador
```

### Flow 2: Usuario recurrente — Continuar proyecto

```
/login
    → /dashboard
        → Lista de proyectos activos con % de progreso por fase
    → /projects/:id
        → Estado actual del proyecto (fase activa)
        → Continuar desde donde lo dejo
```

### Flow 3: Phase 00 — Discovery interactivo

```
/projects/:id/phase/00
    → Orquestador saluda con contexto del proyecto
    → Conversacion guiada en 5 secciones:
        1. Problem Statement
        2. User Personas (genera 3-4 perfiles)
        3. Value Proposition Canvas
        4. Success Metrics y KPIs
        5. Competitive Analysis
    → Al completar cada seccion: auto-genera el documento en /docs/discovery/
    → Gate de aprobacion: "Aprobar y avanzar a Phase 01" o "Revisar"
    → Si aprueba → desbloquea Phase 01
```

### Flow 4: Phase 01 — KIRO Spec Generator

```
/projects/:id/phase/01
    → Orquestador muestra resumen de Phase 00 aprobado
    → Seleccion de feature a especificar
    → Conversacion guiada para generar:
        requirements.md (user stories + acceptance criteria)
        design.md (data model + UI flow + API design)
        tasks.md (tasks atomicas con orden de ejecucion)
    → Preview y edicion inline de cada documento
    → Gate de aprobacion por documento
    → Si todos aprobados → desbloquea Phase 02
```

### Flow 5: Chat con Agentes especializados

```
/projects/:id/agents
    → Seleccion de agente: CTO Virtual, Architect, Frontend Dev,
      Backend Dev, DB Admin, QA Engineer, DevOps
    → Chat contextualizado con el proyecto activo
    → El agente tiene acceso a todos los docs del proyecto (/docs/)
    → Respuestas incluyen: codigo, decisiones, recomendaciones
    → Opcion de guardar respuesta como artifact en /docs/
```

---

## 6. Requerimientos Funcionales por Modulo

### M1 — Auth & Onboarding
- Registro con email/password y Google OAuth
- Login con email/password y Google OAuth
- Recuperacion de contrasena via email
- Onboarding de 4 pasos con seleccion de persona y creacion de proyecto
- Sesion persistente con refresh token (7 dias)
- Rutas protegidas con redirect automatico

### M2 — Project Dashboard
- Crear, ver, editar y archivar proyectos
- Vista de estado por fase (0–7) con indicador de progreso
- Acceso rapido a la fase activa de cada proyecto
- Indicador visual de fases completadas, activa y bloqueadas
- Busqueda y filtro de proyectos

### M3 — Phase 00 Interactivo
- Conversacion guiada con orquestador para completar las 5 secciones del discovery
- Generacion automatica de documentos en `/docs/discovery/`
- Edicion inline de documentos generados
- Gate de aprobacion por seccion y gate final de la fase
- Indicador de completitud por seccion (0–100%)

### M4 — Generador KIRO
- Conversacion guiada para generar specs de cada feature
- Generacion de requirements.md con user stories y acceptance criteria en EARS
- Generacion de design.md con data model, UI flow y API design
- Generacion de tasks.md con tasks atomicas ordenadas
- Vista preview y edicion de cada documento antes de aprobar
- Gate de aprobacion por documento y por feature

### M5 — Orquestador + Agentes
- Chat persistente con el CTO Virtual (orquestador general)
- Acceso a 6 agentes especializados via seleccion
- Contexto del proyecto inyectado automaticamente en cada conversacion
- Historial de conversaciones por proyecto
- Opcion de exportar/guardar respuesta como artifact
- Formato enriquecido: markdown, bloques de codigo, tablas

---

## 7. Requerimientos No Funcionales

### Performance
- LCP (Largest Contentful Paint) < 1.5s en paginas de auth
- LCP < 2.5s en dashboard y fases
- Respuesta del orquestador: primero token en < 2s (streaming)
- API Routes: p95 < 500ms para operaciones CRUD
- Bundle size JS inicial < 150KB gzipped

### Seguridad
- Autenticacion via Supabase Auth (JWT + refresh tokens)
- RLS habilitado en todas las tablas de Supabase
- Variables de entorno nunca expuestas al cliente (prefijo NEXT_PUBLIC solo en vars publicas)
- Rate limiting en endpoints de auth: max 5 intentos fallidos / 15 min / IP
- Sanitizacion de inputs de usuario antes de enviar a LLM
- Nunca almacenar API keys de LLM en el cliente

### Escalabilidad
- Arquitectura serverless (Vercel Functions) — escala automaticamente
- Supabase maneja hasta 10,000 conexiones concurrentes en plan Pro
- Streaming de respuestas del LLM para no bloquear la UI
- Documentos del proyecto almacenados en Supabase Storage (no en DB)

### Accesibilidad
- WCAG 2.1 nivel AA
- Navegacion completa por teclado
- Soporte de screen readers (ARIA labels en componentes interactivos)
- Contraste de color minimo 4.5:1

### Disponibilidad
- Uptime objetivo: 99.5% (Vercel SLA + Supabase SLA)
- Deployments sin downtime (Vercel rolling deployments)
- Manejo gracioso de errores del LLM (fallback message, retry automatico)

### Internacionalizacion
- MVP en espanol (es-LATAM)
- Arquitectura preparada para i18n desde el inicio (next-intl)
- Fechas y numeros en formato es-LATAM

---

## 8. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────┐
│                   USUARIO (Browser)                  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│              VERCEL (Edge Network)                   │
│                                                      │
│  Next.js 14 App Router                               │
│  ├── Server Components (SSR)                        │
│  ├── Client Components (interactividad)             │
│  ├── Route Handlers (API)                           │
│  └── Middleware (auth guard)                        │
└──────┬───────────────┬────────────────┬─────────────┘
       │               │                │
┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│  SUPABASE   │ │  ANTHROPIC  │ │   RESEND    │
│             │ │  Claude API  │ │             │
│ PostgreSQL  │ │             │ │  Emails     │
│ Auth        │ │ Streaming   │ │  transacc.  │
│ Storage     │ │ claude-     │ │             │
│ RLS         │ │ sonnet-4-6  │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Stack Tecnologico
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State:** Zustand (cliente), React Query (server state)
- **Forms:** React Hook Form + Zod
- **Backend:** Next.js Route Handlers
- **DB/Auth:** Supabase (PostgreSQL + Auth + Storage)
- **IA:** Anthropic Claude API (claude-sonnet-4-6) con streaming via Vercel AI SDK
- **Hosting:** Vercel
- **Emails:** Resend
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics + Sentry

---

## 9. Modelo de Datos — Vista General

```
auth.users (Supabase Auth)
    │
    ├── user_profiles (1:1)
    │       persona, onboarding_completed, onboarding_step
    │
    └── projects (1:N)
            id, name, description, industry, current_phase, status
            │
            ├── project_phases (1:N)
            │       phase_number, status, completed_at, approved_at
            │
            ├── project_documents (1:N)
            │       phase, document_type, content, version
            │
            └── agent_conversations (1:N)
                    agent_type, messages[], created_at
```

---

## 10. Modelo de Negocio y Pricing

| Plan | Precio | Proyectos | Fases | Agentes |
|------|--------|-----------|-------|---------|
| Starter | $149/mes | 1 activo | 00–04 | CTO Virtual |
| Builder | $299/mes | 2 activos | 00–06 | Todos (6) |
| Agency | $699/mes | 5 activos | 00–07 | Todos + multi-cliente |

---

## 11. Metricas de Exito del Producto

**North Star:** Proyectos completados hasta Phase 06 por mes

| Metrica | Mes 3 | Mes 6 | Mes 12 |
|---------|-------|-------|--------|
| MRR | $5k | $25k | $100k |
| Tasa completion Phase 06 | 30% | 45% | 60% |
| NPS | 30 | 45 | 60 |
| Churn mensual | <8% | <5% | <3% |

---

## 12. Roadmap de Alto Nivel

| Version | Modulos | Timeline estimado |
|---------|---------|-------------------|
| v1.0 MVP | M1–M5 (Auth, Dashboard, Phase 00, KIRO, Agentes) | 12 semanas |
| v1.1 | Phases 02–04 guiadas, notificaciones, mejoras UX | +8 semanas |
| v2.0 | Phases 05–07 guiadas, colaboracion en equipo, integraciones GitHub/Vercel | +12 semanas |
| v3.0 | White-label, SSO, marketplace de templates, API publica | +16 semanas |
