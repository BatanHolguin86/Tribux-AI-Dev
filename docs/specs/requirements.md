# Requirements — AI Squad Command Center
## EARS Notation (Easy Approach to Requirements Syntax)

**Version:** 1.0
**Fecha:** 2026-03-06
**Status:** Pendiente aprobacion CEO/CPO

### Guia de notacion EARS
- **Ubiquitous:** `The system shall [requirement]`
- **Event-driven:** `WHEN [trigger], the system shall [requirement]`
- **State-driven:** `WHILE [state], the system shall [requirement]`
- **Optional:** `WHERE [feature], the system shall [requirement]`
- **Unwanted behavior:** `IF [condition], THEN the system shall [requirement]`

---

## MOD-01: Autenticacion y Sesion

**REQ-001** The system shall allow users to register with a valid email address and a password of minimum 8 characters including at least 1 number.

**REQ-002** The system shall allow users to register and login using Google OAuth in a single interaction.

**REQ-003** WHEN a user registers with email, the system shall send an email confirmation link within 60 seconds.

**REQ-004** WHEN a user submits incorrect credentials, the system shall display an error message without revealing which specific field is incorrect.

**REQ-005** WHEN a user requests password recovery, the system shall send a reset link valid for 1 hour to the registered email.

**REQ-006** WHILE a user is authenticated, the system shall maintain the session for a minimum of 7 days using refresh tokens.

**REQ-007** WHEN an unauthenticated user attempts to access a protected route, the system shall redirect to /login preserving the originally requested URL.

**REQ-008** WHEN a user logs out, the system shall invalidate the session token on both client and server side.

**REQ-009** IF a user fails authentication 5 or more times within 15 minutes from the same IP, THEN the system shall temporarily block further attempts and display a clear message.

**REQ-010** The system shall keep authentication state consistent across multiple browser tabs of the same session.

---

## MOD-02: Onboarding

**REQ-011** WHEN a user completes registration for the first time, the system shall automatically initiate the onboarding flow.

**REQ-012** The system shall present the onboarding in a maximum of 4 steps to avoid overwhelming new users.

**REQ-013** The system shall allow users to select one of 4 user personas: Founder, PM Senior, Consultor/Agency, Emprendedor Digital.

**REQ-014** The system shall allow users to create their first project during onboarding with: name (required), brief description (optional), and industry (selector).

**REQ-015** The system shall present a visual overview of the 8 IA DLC phases before directing the user to their first project.

**REQ-016** WHEN a user completes onboarding, the system shall redirect directly to Phase 00 of their created project.

**REQ-017** The system shall allow users to skip the onboarding, keeping it accessible from the help menu.

**REQ-018** WHEN a user abandons onboarding mid-flow, the system shall persist the current step so they can resume from the same point.

**REQ-019** WHILE onboarding is active, the system shall save progress to the database after each completed step.

---

## MOD-03: Gestion de Proyectos (Dashboard)

**REQ-020** The system shall allow authenticated users to create multiple projects with: name, description, and industry.

**REQ-021** The system shall display all user projects with: name, current phase, progress indicator, last activity date, and status.

**REQ-022** The system shall represent each project's phase progress visually, distinguishing completed, active, and blocked phases.

**REQ-023** The system shall allow users to archive and restore projects without deleting associated data.

**REQ-024** The system shall allow users to filter projects by status (active, paused, completed) and search by name.

**REQ-025** WHEN a user selects a project, the system shall navigate directly to the active phase of that project.

**REQ-026** The system shall enforce project limits per subscription plan: 1 project (Starter), 2 projects (Builder), 5 projects (Agency).

**REQ-027** IF a user attempts to create a project beyond their plan limit, THEN the system shall display an upgrade prompt with plan comparison.

**REQ-028** The system shall display a phase timeline for each project showing: phase name, status, completion date (if applicable), and next action required.

---

## MOD-04: Phase 00 — Discovery Interactivo

**REQ-029** WHEN a user enters Phase 00, the system shall initiate a guided conversation with the AI orchestrator pre-loaded with the project context.

**REQ-030** The system shall guide the user through 5 discovery sections: Problem Statement, User Personas, Value Proposition, Success Metrics, Competitive Analysis.

**REQ-031** WHEN a discovery section is completed, the system shall auto-generate the corresponding markdown document in the project's /docs/discovery/ directory.

**REQ-032** The system shall allow users to edit generated documents inline before approving them.

**REQ-033** The system shall present an approval gate at the end of each section and a final gate for Phase 00 completion.

**REQ-034** WHEN a user approves Phase 00, the system shall unlock Phase 01 and update the project's phase status.

**REQ-035** WHILE Phase 00 is active, the system shall display a completion indicator per section (0–100%).

**REQ-036** IF a user requests revision of an approved section, THEN the system shall allow re-opening the section for editing without losing progress on other sections.

**REQ-037** The system shall persist all AI conversation history for Phase 00 associated to the project.

---

## MOD-05: Phase 01 — Generador KIRO

**REQ-038** WHEN a user enters Phase 01, the system shall display a summary of the approved Phase 00 as context for spec generation.

**REQ-039** The system shall allow users to define and name the features to be specified in Phase 01.

**REQ-040** The system shall guide the generation of requirements.md for each feature, including user stories in role-action-benefit format and acceptance criteria.

**REQ-041** The system shall guide the generation of design.md for each feature, including data model, UI/UX flow, API design, and architecture decisions.

**REQ-042** The system shall guide the generation of tasks.md for each feature, including atomic tasks with suggested execution order.

**REQ-043** The system shall present a preview of each generated document with inline editing capability before approval.

**REQ-044** WHEN all three KIRO documents for a feature are approved, the system shall mark the feature spec as complete.

**REQ-045** WHEN all feature specs are approved, the system shall present the final Phase 01 approval gate.

**REQ-046** WHEN a user approves Phase 01, the system shall unlock Phase 02 and save all spec documents to the project repository.

**REQ-047** The system shall allow adding multiple features within Phase 01 before approving the phase.

---

## MOD-06: Orquestador IA y Agentes Especializados

**REQ-048** The system shall provide a persistent chat interface with the AI orchestrator (CTO Virtual) available from any project phase.

**REQ-049** The system shall provide access to 6 specialized agents: Product Architect, System Architect, Lead Developer, DB Admin, QA Engineer, DevOps Engineer.

**REQ-050** WHEN a user initiates a conversation with an agent, the system shall automatically inject the full project context (all approved documents) into the agent's context.

**REQ-051** The system shall stream AI responses token by token to avoid blocking the UI during generation.

**REQ-052** The system shall render AI responses with full markdown support including: headers, lists, code blocks with syntax highlighting, and tables.

**REQ-053** The system shall persist all agent conversation history per project and per agent.

**REQ-054** WHEN a user requests to save an AI response, the system shall allow exporting it as a document artifact in /docs/.

**REQ-055** IF the AI service is unavailable, THEN the system shall display a graceful error message and offer a retry option without losing conversation history.

**REQ-056** The system shall display the active agent name and specialization clearly in the chat interface.

**REQ-057** WHILE streaming a response, the system shall display a visual indicator and allow the user to stop generation.

---

## MOD-07: Documentos y Artifacts

**REQ-058** The system shall store all project documents (discovery, specs, architecture decisions) associated to the project and accessible from the project interface.

**REQ-059** The system shall render all documents in formatted markdown view with option to switch to raw edit mode.

**REQ-060** The system shall track document versions, preserving previous versions when a document is edited and re-approved.

**REQ-061** The system shall organize documents by phase in a navigable sidebar within each project.

**REQ-062** WHERE a project has completed Phase 01, the system shall allow exporting all KIRO specs as a ZIP file.

---

## MOD-08: Notificaciones y Progreso

**REQ-063** The system shall display a global progress indicator per project showing completed phases vs total phases (0–7).

**REQ-064** WHEN a phase is completed and approved, the system shall display a visual celebration/confirmation to reinforce progress.

**REQ-065** WHEN a user has not interacted with a project for more than 3 days, the system shall display a re-engagement prompt on the dashboard.

**REQ-066** The system shall send a weekly email summary of project activity to active users.

---

## MOD-09: Configuracion y Cuenta

**REQ-067** The system shall allow users to update their display name and selected persona from account settings.

**REQ-068** The system shall display the current subscription plan and usage (projects used / limit).

**REQ-069** WHERE a user is on the Starter plan, the system shall display upgrade prompts when accessing features exclusive to higher plans.

**REQ-070** The system shall allow users to delete their account and all associated data (GDPR compliance).

---

## MOD-10: Seguridad y Privacidad

**REQ-071** The system shall apply Row Level Security (RLS) on all Supabase tables containing user data.

**REQ-072** The system shall never expose LLM API keys to the client — all AI calls shall be made from server-side Route Handlers.

**REQ-073** The system shall sanitize all user inputs before including them in LLM prompts to prevent prompt injection.

**REQ-074** The system shall log all authentication events (login, logout, failed attempts) for security auditing.

**REQ-075** IF a security anomaly is detected (multiple failed logins, unusual access patterns), THEN the system shall flag the event for review.
