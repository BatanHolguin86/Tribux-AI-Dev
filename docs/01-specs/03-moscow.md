# Feature Priority Matrix — MoSCoW

## AI Squad Command Center

**Version:** 1.0
**Fecha:** 2026-03-06
**Status:** Pendiente aprobacion CEO/CPO

---

## Criterios de Priorizacion

| Criterio                     | Peso | Descripcion                                               |
| ---------------------------- | ---- | --------------------------------------------------------- |
| Valor para el usuario        | 35%  | Impacto directo en el job-to-be-done del usuario primario |
| Necesidad para el flujo core | 30%  | Sin este feature, el producto no es utilizable end-to-end |
| Esfuerzo de implementacion   | 20%  | Complejidad tecnica y tiempo estimado                     |
| Diferenciacion competitiva   | 15%  | Cuanto distingue este feature de alternativas existentes  |

---

## MUST HAVE — MVP (v1.0)

> Sin estos features, el producto no existe o no cumple su promesa central.

### Autenticacion y Sesion

- [x] Registro con email + password
- [x] Login con email + password
- [x] Google OAuth (registro y login)
- [x] Recuperacion de contrasena via email
- [x] Sesion persistente con refresh token
- [x] Proteccion de rutas autenticadas
- [x] Logout seguro

### Onboarding

- [x] Flujo de onboarding de 4 pasos para nuevos usuarios
- [x] Seleccion de persona de usuario (Founder / PM / Consultor / Emprendedor)
- [x] Creacion de primer proyecto durante onboarding
- [x] Vista introductoria de las 8 fases IA DLC

### Gestion de Proyectos

- [x] Crear proyectos (nombre, descripcion, industria)
- [x] Dashboard con lista de proyectos activos
- [x] Indicador visual de fase actual y progreso por proyecto
- [x] Navegacion directa a la fase activa del proyecto
- [x] Archivar y restaurar proyectos

### Phase 00 — Discovery Interactivo

- [x] Conversacion guiada con orquestador para Problem Statement
- [x] Generacion asistida de User Personas (minimo 3)
- [x] Generacion asistida de Value Proposition Canvas
- [x] Generacion asistida de Success Metrics y KPIs
- [x] Generacion asistida de Competitive Analysis
- [x] Auto-generacion de documentos markdown en /docs/00-discovery/
- [x] Edicion inline de documentos generados
- [x] Gate de aprobacion por seccion y gate final de Phase 00
- [x] Desbloqueo de Phase 01 al aprobar Phase 00

### Phase 01 — Generador KIRO

- [x] Definicion de features a especificar
- [x] Generacion guiada de requirements.md (user stories + acceptance criteria)
- [x] Generacion guiada de design.md (data model + UI flow + API design)
- [x] Generacion guiada de tasks.md (tasks atomicas ordenadas)
- [x] Preview y edicion de documentos antes de aprobar
- [x] Gate de aprobacion por documento y por feature
- [x] Gate final de Phase 01 y desbloqueo de Phase 02

### Diseño UI/UX (wireframes y mockups)

- [ ] Generacion de wireframes por flujo/pantalla a partir de design.md y user flows
- [ ] Generacion de mockups (low-fi o high-fi) para pantallas clave del producto
- [ ] Almacenamiento y vista de diseños en el proyecto (docs/design/ o equivalente)
- [ ] Integracion en el flujo: disponible tras Phase 01 (KIRO) y antes de Phase 04 (Core Development)
- [ ] Agente IA dedicado UI/UX Designer en el orquestador para generar y refinar diseños

### Orquestador IA y Agentes

- [x] Chat persistente con CTO Virtual (orquestador general)
- [x] Acceso a 7 agentes especializados con contexto del proyecto (incl. UI/UX Designer)
- [x] Streaming de respuestas del LLM
- [x] Renderizado markdown con syntax highlighting en chat
- [x] Historial de conversaciones por proyecto y agente
- [x] Manejo gracioso de errores del LLM con retry
- [ ] Sugerencias proactivas de los agentes (sin que el usuario pregunte), basadas en estado del proyecto y fase actual — v1.0

### Phase 02 — Arquitectura Interactiva

- [ ] Guia interactiva para definir arquitectura y ADRs
- [ ] Generacion de diagramas y documentos de arquitectura
- [ ] Gate de aprobacion y desbloqueo de Phase 03

### Phase 03 — Environment Setup Interactivo

- [ ] Checklist guiado de environment setup (Supabase, Vercel, GitHub)
- [ ] Validacion de configuracion y conexiones
- [ ] Gate de aprobacion y desbloqueo de Phase 04

### Phase 04 — Core Development Interactivo

- [ ] Kanban de tasks generadas en KIRO
- [ ] Integracion con chat de agentes para ejecutar tasks
- [ ] Seguimiento de progreso por task
- [ ] Gate de aprobacion y desbloqueo de Phase 05

### Phase 05 — Testing & QA Interactivo

- [ ] Generador de test cases desde specs
- [ ] Reporte de QA interactivo con estado por test
- [ ] Gate de aprobacion y desbloqueo de Phase 06

### Phase 06 — Launch Interactivo

- [ ] Launch checklist interactivo con estado de cada item
- [ ] Validacion pre-deploy
- [ ] Gate de aprobacion y desbloqueo de Phase 07

### Phase 07 — Iteration Interactivo

- [ ] Retrospectiva guiada
- [ ] Generacion de backlog para siguiente sprint
- [ ] Cierre de fase y proyecto

### Documentos y Artifacts

- [x] Almacenamiento de todos los documentos del proyecto
- [x] Vista formateada markdown + modo edicion raw
- [x] Organizacion de documentos por fase en sidebar

### Seguridad Core

- [x] RLS en todas las tablas de Supabase
- [x] API keys del LLM nunca expuestas al cliente
- [x] Sanitizacion de inputs antes de enviar a LLM
- [x] Rate limiting en endpoints de auth

---

## SHOULD HAVE — v1.1

> Features importantes que agregan valor significativo pero el MVP puede lanzar sin ellos.

### UX y Engagement

- [ ] Re-engagement prompt para proyectos inactivos (3+ dias)
- [ ] Celebracion visual al completar una fase (confetti, animacion)
- [ ] Email semanal de resumen de actividad del proyecto
- [ ] Indicador de "siguiente accion recomendada" en el dashboard
- [ ] Onboarding contextualizado por persona seleccionada (lenguaje diferente para Founder vs PM)

### Gestion de Proyectos

- [ ] Busqueda y filtro de proyectos por nombre, industria y estado
- [ ] Duplicar proyecto (template para proyectos similares)
- [ ] Notas personales por proyecto (scratch pad del CEO/CPO)
- [ ] Vista de timeline del proyecto con fechas estimadas por fase

### Documentos y Artifacts

- [ ] Versionado de documentos (historial de cambios)
- [ ] Export de specs KIRO completos como ZIP
- [ ] Busqueda dentro de los documentos del proyecto

### Cuenta y Configuracion

- [ ] Edicion de perfil (nombre, persona, foto)
- [ ] Vista de uso del plan (proyectos activos / limite)
- [ ] Prompts de upgrade contextualizados cuando se alcanza limite del plan

---

## COULD HAVE — v2.0

> Features deseables que mejoran la propuesta pero pueden esperar a validar el core.

### Colaboracion

- [ ] Invitar colaboradores a un proyecto (multi-user)
- [ ] Roles en el proyecto: Owner, Editor, Viewer
- [ ] Comentarios y menciones en documentos
- [ ] Historial de actividad del proyecto (audit trail)

### Integraciones

- [ ] Conexion directa con repositorio GitHub (push de codigo generado)
- [ ] Conexion con Vercel (ver deployments desde la plataforma)
- [ ] Conexion con Supabase (ver tablas y migraciones aplicadas)
- [ ] Export a Notion / Confluence de documentos del proyecto
- [ ] Webhook para notificaciones en Slack

### Mejoras de IA

- [ ] Memoria persistente entre proyectos (el orquestador recuerda patrones del usuario)
- [ ] Generacion de codigo ejecutable por el agente Developer
- [ ] Analisis de codigo existente subido por el usuario

### Agencia y White-label

- [ ] Vista multi-cliente para plan Agency
- [ ] White-label parcial (logo y colores del cliente)
- [ ] Dashboard de agency con estado de todos los proyectos de clientes
- [ ] Reportes de progreso exportables para presentar a clientes

### Monetizacion y Growth

- [ ] Plan gratuito con limite de 1 proyecto y fases 00–01
- [ ] Billing integrado con Stripe (upgrade/downgrade de plan)
- [ ] Creditos de IA por uso (alternativa al plan mensual fijo)
- [ ] Programa de referidos con descuento

---

## WON'T HAVE — Fuera de roadmap actual

> Features excluidos explicitamente para mantener el foco del producto.

### Excluidos de v1.0 al v2.0

- [ ] App movil nativa (iOS / Android) — la plataforma es web-first, mobile-responsive
- [ ] Marketplace de templates de proyectos — complejidad alta, valor incierto en MVP
- [ ] Ejecucion autonoma de codigo (el agente corre el codigo por su cuenta) — riesgo de seguridad alto
- [ ] IA que hace commits y PRs automaticamente — requiere nivel de confianza que el MVP no puede garantizar
- [ ] API publica para integraciones de terceros — complejidad de mantenimiento alta
- [ ] SSO empresarial (SAML / LDAP) — mercado enterprise no es el objetivo del MVP
- [ ] Soporte de multiples idiomas en v1.0 — MVP es espanol, i18n se prepara pero no se activa
- [ ] Integracion con herramientas de PM (Jira, Linear, Asana) — v3 si hay demanda
- [ ] Video tutoriales generados por IA — produccion costosa, baja prioridad

---

## Resumen de Prioridades

| Version          | Features                                                          | Timeline      |
| ---------------- | ----------------------------------------------------------------- | ------------- |
| v1.0 MVP         | 53+ features Must Have (incl. diseño UI/UX, Phases 02–07 guiadas) | 20–24 semanas |
| v1.1             | 20 features Should Have                                           | +6 semanas    |
| v2.0             | 28 features Could Have                                            | +12 semanas   |
| Fuera de roadmap | 12 features Won't Have                                            | —             |
