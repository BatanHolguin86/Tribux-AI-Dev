# Folder Structure — AI Squad Command Center

**Phase:** 02 — Architecture & Design
**Fecha:** 2026-03-08
**Status:** Pendiente aprobacion CEO/CPO

---

## Estructura Definitiva del Proyecto

```
/
├── CLAUDE.md                              # Instrucciones del orquestador
├── .env.local                             # Variables de entorno locales (NO commit)
├── .env.example                           # Template de variables (SI commit)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json                          # TypeScript strict: true
├── next.config.ts                         # Next.js 14 config
├── tailwind.config.ts                     # Tailwind + shadcn/ui theme
├── postcss.config.js
├── vitest.config.ts                       # Vitest config
├── playwright.config.ts                   # Playwright E2E config
├── .eslintrc.json                         # ESLint + Prettier
├── .prettierrc
├── .gitignore
│
├── docs/                                  # Toda la documentacion del proyecto
│   ├── discovery/                         # Phase 00 — briefs e investigacion
│   │   ├── brief.md
│   │   ├── personas.md
│   │   ├── value-proposition.md
│   │   ├── metrics.md
│   │   └── competitive-analysis.md
│   │
│   ├── specs/                             # Phase 01 — specs KIRO por feature
│   │   ├── prd.md                         # Product Requirements Document
│   │   ├── requirements.md                # System requirements (EARS)
│   │   ├── moscow.md                      # Feature priority matrix
│   │   ├── constraints.md                 # Technical & business constraints
│   │   ├── metrics-instrumentation.md     # Event tracking spec
│   │   ├── pricing-experiments.md         # Pricing experiments spec
│   │   │
│   │   ├── auth-onboarding/
│   │   │   ├── requirements.md
│   │   │   ├── design.md
│   │   │   └── tasks.md
│   │   ├── project-dashboard/
│   │   │   ├── requirements.md
│   │   │   ├── design.md
│   │   │   └── tasks.md
│   │   ├── phase-00-interactive/
│   │   │   ├── requirements.md
│   │   │   ├── design.md
│   │   │   └── tasks.md
│   │   ├── kiro-generator/
│   │   │   ├── requirements.md
│   │   │   ├── design.md
│   │   │   └── tasks.md
│   │   ├── orchestrator/
│   │   │   ├── requirements.md
│   │   │   ├── design.md
│   │   │   └── tasks.md
│   │   └── ui-ux-design-generator/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   │
│   ├── architecture/                      # Phase 02 — arquitectura y ADRs
│   │   ├── system-architecture.md         # Diagramas de sistema
│   │   ├── database-schema.md             # Esquema completo de DB
│   │   ├── folder-structure.md            # Este archivo
│   │   └── decisions/                     # Architecture Decision Records
│   │       ├── ADR-001-stack-selection.md
│   │       ├── ADR-002-supabase-auth.md
│   │       ├── ADR-003-vercel-ai-sdk.md
│   │       ├── ADR-004-document-storage.md
│   │       └── ADR-005-agent-architecture.md
│   │
│   ├── qa/                                # Phase 05 — reportes de calidad
│   └── ops/                               # Phase 06 — runbooks operacionales
│
├── src/                                   # Codigo fuente de la aplicacion
│   │
│   ├── app/                               # Next.js App Router
│   │   ├── layout.tsx                     # Root layout (fonts, providers)
│   │   ├── page.tsx                       # / redirect logic
│   │   ├── not-found.tsx                  # 404 page
│   │   ├── error.tsx                      # Global error boundary
│   │   ├── globals.css                    # Tailwind directives + shadcn vars
│   │   │
│   │   ├── (auth)/                        # Auth route group (no layout)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── auth/
│   │   │       ├── callback/route.ts      # OAuth callback handler
│   │   │       └── reset-password/page.tsx
│   │   │
│   │   ├── (dashboard)/                   # Dashboard route group (shared layout)
│   │   │   ├── layout.tsx                 # Sidebar + header layout
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx               # Projects grid (SSR)
│   │   │   │   ├── loading.tsx
│   │   │   │   └── error.tsx
│   │   │   │
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx               # 4-step onboarding flow
│   │   │   │
│   │   │   ├── projects/
│   │   │   │   └── [id]/
│   │   │   │       ├── layout.tsx         # Project layout (breadcrumb, sidebar)
│   │   │   │       ├── page.tsx           # Redirect to active phase
│   │   │   │       │
│   │   │   │       ├── phase/
│   │   │   │       │   ├── 00/
│   │   │   │       │   │   ├── page.tsx   # Phase 00 Discovery (SSR)
│   │   │   │       │   │   ├── loading.tsx
│   │   │   │       │   │   └── error.tsx
│   │   │   │       │   ├── 01/
│   │   │   │       │   │   ├── page.tsx   # Phase 01 KIRO Generator (SSR)
│   │   │   │       │   │   ├── loading.tsx
│   │   │   │       │   │   └── error.tsx
│   │   │   │       │   ├── 02/
│   │   │   │       │   │   └── page.tsx   # Phase 02 Architecture (SSR)
│   │   │   │       │   ├── 03/
│   │   │   │       │   │   └── page.tsx   # Phase 03 Environment Setup
│   │   │   │       │   ├── 04/
│   │   │   │       │   │   └── page.tsx   # Phase 04 Core Development
│   │   │   │       │   ├── 05/
│   │   │   │       │   │   └── page.tsx   # Phase 05 Testing & QA
│   │   │   │       │   ├── 06/
│   │   │   │       │   │   └── page.tsx   # Phase 06 Launch
│   │   │   │       │   └── 07/
│   │   │   │       │       └── page.tsx   # Phase 07 Iteration
│   │   │   │       │
│   │   │   │       ├── agents/
│   │   │   │       │   ├── page.tsx       # Agent selection + chat (SSR)
│   │   │   │       │   ├── loading.tsx
│   │   │   │       │   └── error.tsx
│   │   │   │       │
│   │   │   │       └── designs/
│   │   │   │           ├── page.tsx       # Design gallery (SSR)
│   │   │   │           └── [artifactId]/
│   │   │   │               └── page.tsx   # Design detail view
│   │   │   │
│   │   │   └── settings/
│   │   │       └── page.tsx               # Account settings
│   │   │
│   │   └── api/                           # Route Handlers
│   │       ├── onboarding/
│   │       │   ├── complete/route.ts
│   │       │   └── step/route.ts
│   │       │
│   │       └── projects/
│   │           ├── route.ts               # GET (list), POST (create)
│   │           └── [id]/
│   │               ├── route.ts           # GET, PATCH (update/archive)
│   │               ├── phases/
│   │               │   ├── route.ts       # GET all phases
│   │               │   ├── [phase]/
│   │               │   │   ├── approve/route.ts
│   │               │   │   ├── status/route.ts
│   │               │   │   ├── chat/route.ts           # Phase chat (streaming)
│   │               │   │   └── sections/
│   │               │   │       └── [section]/
│   │               │   │           ├── generate/route.ts
│   │               │   │           └── approve/route.ts
│   │               │   └── 1/
│   │               │       └── features/
│   │               │           ├── route.ts             # GET, POST features
│   │               │           ├── suggest/route.ts     # AI feature suggestions
│   │               │           └── [featureId]/
│   │               │               ├── route.ts         # PATCH, DELETE
│   │               │               ├── chat/route.ts    # KIRO chat (streaming)
│   │               │               └── documents/
│   │               │                   └── [docType]/
│   │               │                       ├── generate/route.ts
│   │               │                       ├── route.ts  # PATCH (edit)
│   │               │                       └── approve/route.ts
│   │               ├── agents/
│   │               │   ├── route.ts                     # GET agents list
│   │               │   └── [agentType]/
│   │               │       └── threads/
│   │               │           ├── route.ts             # GET, POST threads
│   │               │           └── [threadId]/
│   │               │               ├── route.ts         # DELETE thread
│   │               │               ├── chat/route.ts    # Agent chat (streaming)
│   │               │               └── stop/route.ts    # Stop generation
│   │               ├── documents/
│   │               │   └── [documentId]/
│   │               │       └── route.ts                 # GET, PATCH
│   │               ├── designs/
│   │               │   ├── route.ts                     # GET list
│   │               │   ├── generate/route.ts            # POST generate
│   │               │   └── [artifactId]/
│   │               │       ├── route.ts                 # GET detail, PATCH status
│   │               │       └── refine/route.ts          # POST refine
│   │               └── artifacts/
│   │                   └── route.ts                     # POST save artifact
│   │
│   ├── components/                        # React components
│   │   ├── ui/                            # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── card.tsx
│   │   │   └── ... (as needed)
│   │   │
│   │   ├── shared/                        # Shared components across features
│   │   │   ├── chat/
│   │   │   │   ├── ChatHistory.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── StreamingIndicator.tsx
│   │   │   ├── document/
│   │   │   │   ├── DocumentPanel.tsx
│   │   │   │   ├── DocumentViewer.tsx
│   │   │   │   ├── DocumentEditor.tsx
│   │   │   │   └── DocumentHeader.tsx
│   │   │   └── ApprovalGate.tsx
│   │   │
│   │   ├── layout/                        # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   └── MobileNav.tsx
│   │   │
│   │   ├── auth/                          # Auth feature components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── ResetPasswordForm.tsx
│   │   │   └── OAuthButton.tsx
│   │   │
│   │   ├── onboarding/                    # Onboarding feature components
│   │   │   ├── OnboardingLayout.tsx
│   │   │   ├── WelcomeStep.tsx
│   │   │   ├── PersonaStep.tsx
│   │   │   ├── ProjectStep.tsx
│   │   │   └── PhasesOverviewStep.tsx
│   │   │
│   │   ├── dashboard/                     # Dashboard feature components
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── ProjectsGrid.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectCardExpanded.tsx
│   │   │   ├── CreateProjectModal.tsx
│   │   │   ├── EditProjectModal.tsx
│   │   │   ├── PhaseTimeline.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── phase-00/                      # Phase 00 specific components
│   │   │   ├── Phase00Layout.tsx
│   │   │   ├── SectionNav.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── DocumentPanel.tsx          # Phase00-specific wrapper
│   │   │   └── Phase00FinalGate.tsx
│   │   │
│   │   ├── phase-01/                      # Phase 01 specific components
│   │   │   ├── Phase01Layout.tsx
│   │   │   ├── DiscoverySummary.tsx
│   │   │   ├── FeatureList.tsx
│   │   │   ├── FeatureItem.tsx
│   │   │   ├── AddFeatureForm.tsx
│   │   │   ├── FeatureSuggestions.tsx
│   │   │   ├── DocumentTypeNav.tsx
│   │   │   ├── KiroChat.tsx
│   │   │   └── Phase01FinalGate.tsx
│   │   │
│   │   ├── agents/                        # Agent chat components
│   │   │   ├── AgentsLayout.tsx
│   │   │   ├── AgentSelector.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentHeader.tsx
│   │   │   ├── ThreadSidebar.tsx
│   │   │   ├── ThreadItem.tsx
│   │   │   ├── AgentChat.tsx
│   │   │   ├── MessageActions.tsx
│   │   │   ├── SaveArtifactModal.tsx
│   │   │   ├── FloatingAgentButton.tsx
│   │   │   └── MiniAgentDrawer.tsx
│   │   │
│   │   └── designs/                       # Design artifacts components
│   │       ├── DesignGallery.tsx
│   │       ├── DesignCard.tsx
│   │       ├── DesignDetail.tsx
│   │       ├── DesignGenerateModal.tsx
│   │       └── DesignRefineForm.tsx
│   │
│   ├── lib/                               # Utilities and configs
│   │   ├── supabase/
│   │   │   ├── server.ts                  # createServerClient
│   │   │   ├── client.ts                  # createBrowserClient
│   │   │   └── middleware.ts              # createMiddlewareClient
│   │   │
│   │   ├── ai/
│   │   │   ├── anthropic.ts              # AI provider config
│   │   │   ├── context-builder.ts        # Build project context for LLM
│   │   │   ├── title-generator.ts        # Auto-generate thread titles
│   │   │   ├── prompts/
│   │   │   │   ├── phase-00.ts           # Phase 00 section prompts
│   │   │   │   ├── phase-01.ts           # KIRO document prompts
│   │   │   │   └── feature-suggestions.ts
│   │   │   └── agents/
│   │   │       ├── index.ts              # Agent registry (8 agents)
│   │   │       ├── cto-virtual.ts
│   │   │       ├── product-architect.ts
│   │   │       ├── system-architect.ts
│   │   │       ├── ui-ux-designer.ts
│   │   │       ├── lead-developer.ts
│   │   │       ├── db-admin.ts
│   │   │       ├── qa-engineer.ts
│   │   │       ├── devops-engineer.ts
│   │   │       └── prompt-builder.ts
│   │   │
│   │   ├── validations/                   # Zod schemas
│   │   │   ├── auth.ts
│   │   │   ├── projects.ts
│   │   │   ├── features.ts
│   │   │   ├── designs.ts
│   │   │   └── common.ts
│   │   │
│   │   ├── storage/
│   │   │   └── documents.ts              # Upload, get, signed URL helpers
│   │   │
│   │   └── utils.ts                       # General helpers (cn, formatDate, etc.)
│   │
│   ├── hooks/                             # Custom React hooks
│   │   ├── use-supabase.ts               # Supabase client hook
│   │   ├── use-project.ts                # Current project context
│   │   ├── use-phase-status.ts           # Phase completion status
│   │   └── use-media-query.ts            # Responsive breakpoints
│   │
│   ├── stores/                            # Zustand stores
│   │   ├── phase-00-store.ts
│   │   ├── phase-01-store.ts
│   │   └── agents-store.ts
│   │
│   ├── types/                             # Global TypeScript types
│   │   ├── user.ts                        # UserProfile, Persona
│   │   ├── project.ts                     # Project, ProjectPhase, ProjectStatus
│   │   ├── conversation.ts                # Message, ConversationRole, SectionStatus
│   │   ├── document.ts                    # ProjectDocument, DocumentType
│   │   ├── feature.ts                     # ProjectFeature, FeatureDocument
│   │   ├── agent.ts                       # AgentType, AgentDefinition, Thread
│   │   ├── design.ts                      # DesignArtifact, DesignType
│   │   └── api.ts                         # ApiResponse<T>, ApiError
│   │
│   └── middleware.ts                      # Next.js middleware (auth guard)
│
├── tests/                                 # Tests
│   ├── unit/                              # Vitest unit tests
│   │   ├── ai/
│   │   │   ├── prompts/
│   │   │   │   ├── phase-00.test.ts
│   │   │   │   └── phase-01.test.ts
│   │   │   └── agents/
│   │   │       └── prompts.test.ts
│   │   ├── validations/
│   │   │   ├── auth.test.ts
│   │   │   ├── projects.test.ts
│   │   │   ├── features.test.ts
│   │   │   └── designs.test.ts
│   │   └── lib/
│   │       ├── context-builder.test.ts
│   │       └── title-generator.test.ts
│   │
│   ├── integration/                       # Vitest integration tests
│   │   └── api/
│   │       ├── onboarding.test.ts
│   │       ├── projects.test.ts
│   │       ├── phase-00-chat.test.ts
│   │       ├── phase-00-approve.test.ts
│   │       ├── features.test.ts
│   │       ├── kiro-documents.test.ts
│   │       ├── phase-01-approve.test.ts
│   │       ├── threads.test.ts
│   │       ├── agent-chat.test.ts
│   │       └── artifacts.test.ts
│   │
│   └── e2e/                               # Playwright E2E tests
│       ├── auth.spec.ts
│       ├── onboarding.spec.ts
│       ├── dashboard.spec.ts
│       ├── phase-00.spec.ts
│       ├── phase-01.spec.ts
│       ├── agents.spec.ts
│       └── agents-paywall.spec.ts
│
├── infrastructure/                        # Infrastructure config
│   ├── supabase/
│   │   ├── migrations/
│   │   │   ├── 001_create_user_profiles.sql
│   │   │   ├── 002_create_projects.sql
│   │   │   ├── 003_create_project_phases.sql
│   │   │   ├── 004_create_phase_sections.sql
│   │   │   ├── 005_create_agent_conversations.sql
│   │   │   ├── 006_create_project_documents.sql
│   │   │   ├── 007_create_project_features.sql
│   │   │   ├── 008_create_feature_documents.sql
│   │   │   ├── 009_create_conversation_threads.sql
│   │   │   ├── 010_create_design_artifacts.sql
│   │   │   └── 011_create_updated_at_triggers.sql
│   │   └── seed.sql                       # Datos iniciales (industries, etc.)
│   │
│   ├── github/
│   │   └── workflows/
│   │       ├── ci.yml                     # Lint + Type check + Tests
│   │       └── deploy.yml                 # Deploy to Vercel (if not auto)
│   │
│   └── scripts/
│       ├── setup-local.sh                 # Local dev setup script
│       └── migrate.sh                     # Run Supabase migrations
│
└── public/                                # Static assets
    ├── favicon.ico
    ├── logo.svg
    └── og-image.png
```

---

## Convenciones de Naming

| Elemento | Convencion | Ejemplo |
|----------|-----------|---------|
| Archivos y carpetas | `kebab-case` | `phase-00-store.ts` |
| Componentes React | `PascalCase` | `ProjectCard.tsx` |
| Route Handlers | `route.ts` (Next.js convention) | `api/projects/route.ts` |
| Types | `PascalCase` | `ProjectFeature` |
| Zod schemas | `camelCase` + Schema suffix | `createProjectSchema` |
| Zustand stores | `kebab-case` + store suffix | `phase-01-store.ts` |
| Migrations | `NNN_description.sql` | `007_create_project_features.sql` |
| Tests | Match source file + `.test.ts` / `.spec.ts` | `context-builder.test.ts` |
