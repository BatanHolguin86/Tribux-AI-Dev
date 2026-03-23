# Instrumentacion y Metricas de Producto

**Version:** 1.0
**Fecha:** 2026-03-06
**Referencia:** PRD §11, `docs/00-discovery/04-metrics.md`
**Status:** Pendiente aprobacion CEO/CPO

---

## Objetivo

Definir los eventos, embudos y definiciones de activacion a instrumentar en el producto para validar rapidamente donde los usuarios se atascan, antes de depender solo de metricas de MRR.

---

## 1. Eventos Minimos

### Auth & Onboarding

| Evento                          | Descripcion                          | Propiedades opcionales            |
| ------------------------------- | ------------------------------------ | --------------------------------- |
| `auth_signed_up`                | Usuario creo cuenta (email o OAuth)  | `method`: email \| google         |
| `auth_logged_in`                | Usuario inicio sesion                | `method`: email \| google         |
| `auth_password_reset_requested` | Solicitud de reset de contrasena     | —                                 |
| `auth_password_reset_completed` | Reset de contrasena exitoso          | —                                 |
| `onboarding_started`            | Usuario entro al flujo de onboarding | —                                 |
| `onboarding_step_completed`     | Completó un paso del onboarding      | `step`: 1 \| 2 \| 3 \| 4          |
| `onboarding_completed`          | Termino los 4 pasos                  | `persona`, `has_project`          |
| `onboarding_skipped`            | Omitio el onboarding                 | `step`: ultimo paso antes de skip |

### Proyectos

| Evento             | Descripcion                              | Propiedades opcionales            |
| ------------------ | ---------------------------------------- | --------------------------------- |
| `project_created`  | Proyecto creado (onboarding o dashboard) | `source`: onboarding \| dashboard |
| `project_opened`   | Usuario entro a un proyecto              | `project_id`, `phase`             |
| `project_archived` | Proyecto archivado                       | `project_id`                      |

### Phase 00 — Discovery

| Evento                               | Descripcion                                             | Propiedades opcionales                    |
| ------------------------------------ | ------------------------------------------------------- | ----------------------------------------- |
| `phase00_started`                    | Usuario entro a Phase 00 de un proyecto                 | `project_id`                              |
| `phase00_section_started`            | Inicio una seccion del discovery                        | `section`, `project_id`                   |
| `phase00_section_completed`          | Completó la conversacion de una seccion                 | `section`, `project_id`, `messages_count` |
| `phase00_section_approved`           | Aprobó una seccion                                      | `section`, `project_id`                   |
| `phase00_section_revision_requested` | Solicito revision en lugar de aprobar                   | `section`, `project_id`                   |
| `phase00_approved`                   | Aprobó Phase 00 completo                                | `project_id`, `sections_count`            |
| `phase00_document_edited`            | Edito manualmente un documento generado                 | `section`, `project_id`                   |
| `phase00_abandoned`                  | Salio sin completar (heuristica: 3+ dias sin actividad) | `project_id`, `last_section`              |

### Phase 01 — KIRO

| Evento                       | Descripcion                                      | Propiedades opcionales                        |
| ---------------------------- | ------------------------------------------------ | --------------------------------------------- |
| `phase01_started`            | Usuario entro a Phase 01                         | `project_id`                                  |
| `phase01_feature_defined`    | Definió un feature a especificar                 | `project_id`, `feature_name`                  |
| `phase01_document_generated` | Genero un doc KIRO (requirements, design, tasks) | `document_type`, `feature_name`, `project_id` |
| `phase01_document_approved`  | Aprobó un documento KIRO                         | `document_type`, `feature_name`, `project_id` |
| `phase01_feature_completed`  | Completó spec de un feature (3 docs aprobados)   | `feature_name`, `project_id`                  |
| `phase01_approved`           | Aprobó Phase 01 completo                         | `project_id`, `features_count`                |

### Chat / Agentes

| Evento                               | Descripcion                                                | Propiedades opcionales                          |
| ------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------- |
| `agent_chat_started`                 | Inicio conversacion con un agente                          | `agent_type`, `project_id`                      |
| `agent_proactive_suggestions_shown`  | Se mostraron sugerencias proactivas (hilo vacio)           | `agent_type`, `project_id`, `suggestions_count` |
| `agent_proactive_suggestion_clicked` | Hizo clic en una sugerencia proactiva (envio como mensaje) | `agent_type`, `project_id`, `suggestion_id`     |
| `agent_message_sent`                 | Envio mensaje al agente                                    | `agent_type`, `project_id`                      |
| `agent_response_saved`               | Guardo respuesta como artifact                             | `agent_type`, `project_id`                      |

### Monetizacion (cuando aplique)

| Evento              | Descripcion                        | Propiedades opcionales                             |
| ------------------- | ---------------------------------- | -------------------------------------------------- |
| `paywall_shown`     | Se mostro paywall o limite de plan | `trigger`: phase_limit \| project_limit \| feature |
| `paywall_dismissed` | Cerró el paywall sin convertir     | `trigger`                                          |
| `plan_upgraded`     | Cambio de plan                     | `from_plan`, `to_plan`                             |

---

## 2. Embudos Clave

### Embudo 1: Sign-up → Activacion

```
auth_signed_up (100%)
  → onboarding_completed
  → phase00_started
  → phase00_approved
  → phase01_started
  → phase01_feature_completed
```

**Conversion objetivo por etapa (Mes 3):**

| Etapa                                      | Conversion | Observacion                       |
| ------------------------------------------ | ---------- | --------------------------------- |
| Sign-up → Onboarding completed             | 70%        | Abandono en onboarding es critico |
| Onboarding → Phase 00 started              | 95%        | Deberian llegar directo           |
| Phase 00 started → Phase 00 approved       | 50%        | Mayor friccion esperada aqui      |
| Phase 00 approved → Phase 01 started       | 90%        | Gate desbloqueado                 |
| Phase 01 started → First feature completed | 60%        | Complejidad de KIRO               |
| First feature → Phase 01 approved          | 80%        | Quien llega suele completar       |

### Embudo 2: Proyectos activos por semana

| Metrica                                   | Descripcion                                                           |
| ----------------------------------------- | --------------------------------------------------------------------- |
| Proyectos con actividad en ultimos 7 dias | Cuantos proyectos recibieron al menos 1 evento de Phase 00 o Phase 01 |
| Proyectos que avanzaron de fase           | Phase N completada en ultimos 7 dias                                  |
| Proyectos abandonados                     | Sin actividad 14+ dias y Phase no completada                          |

---

## 3. Definicion de Activacion

**Usuario activado:** Usuario que ha aprobado Phase 00 de al menos un proyecto.

**Justificacion:** Es el primer momento en que el usuario obtiene valor real (documentos de discovery) y demuestra compromiso con el proceso. Los usuarios no activados aun no han validado si la plataforma les sirve.

**Metricas derivadas:**

| Metrica                      | Formula                                         | Target Mes 3 |
| ---------------------------- | ----------------------------------------------- | ------------ |
| Tasa de activacion           | Usuarios activados / Sign-ups (rolling 30 dias) | 35%          |
| Time-to-activation           | Dias desde sign-up hasta Phase 00 approved      | < 5 dias     |
| Activacion en primera sesion | % que activa en la misma sesion que sign-up     | 25%          |

---

## 4. Herramientas y Implementacion

### Stack recomendado

- **Analytics:** Vercel Analytics (basico) + PostHog o Mixpanel (eventos custom)
- **Session replay:** PostHog o FullStory (opcional, para debug de abandono)
- **Cohortes:** Segmentar por `persona`, `industry`, `signup_date`

### Implementacion minima v1.0

1. Wrapper de tracking en `src/lib/analytics.ts` con interface `track(event, props?)`
2. Llamadas en puntos criticos: auth callbacks, onboarding steps, phase gates, paywall
3. User ID = `auth.uid()` (Supabase). No enviar PII en propiedades de evento
4. Las propiedades `project_id` se envian como UUID opaco; no nombres de proyecto

### Eventos obligatorios para el primer deploy

- `auth_signed_up`, `auth_logged_in`
- `onboarding_completed`, `onboarding_skipped`
- `phase00_started`, `phase00_section_approved`, `phase00_approved`
- `phase01_started`, `phase01_feature_completed`, `phase01_approved`

El resto puede añadirse de forma incremental.

---

## 5. Alertas Sugeridas

| Alerta               | Condicion                                               | Accion                                            |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Caida en activacion  | Tasa sign-up → Phase 00 approved < 25% (rolling 7 dias) | Revisar embudo, sesiones de abandono              |
| Abandono en Phase 00 | % que abandona en seccion 2 o 3 > 40%                   | Revisar UX de conversacion, longitud de preguntas |
| Onboarding drop-off  | Tasa onboarding_completed < 50%                         | Revisar pasos 2 y 3 (persona, proyecto)           |
