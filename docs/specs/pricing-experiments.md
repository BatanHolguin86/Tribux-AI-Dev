# Estrategia de Pricing y Trial — MVP v1.0

**Version:** 1.0
**Fecha:** 2026-03-06
**Referencia:** PRD §10, `docs/discovery/brief.md`, `docs/specs/moscow.md`
**Status:** Pendiente aprobacion CEO/CPO

---

## Objetivo

Definir explicitamente la estrategia de trial y pricing para el lanzamiento del MVP, y como se refleja en la UI. Reduce incertidumbre comercial y evita rediseno de UX posterior.

---

## 1. Hipotesis de Pricing Base (ya definidas)

| Plan | Precio | Proyectos | Fases | Agentes |
|------|--------|-----------|-------|---------|
| Starter | $149/mes | 1 activo | 00–04 | CTO Virtual |
| Builder | $299/mes | 2 activos | 00–06 | Todos (7) |
| Agency | $699/mes | 5 activos | 00–07 | Todos + multi-cliente |
| Enterprise | Negociable | A medida | 00–07 + extendido | Todo + SSO, SLA, soporte, custom |

**Enterprise** no forma parte de la tabla de precios fijos: precio y oferta de valor se negocian previa discovery comercial. Ver `docs/discovery/brief.md` — Modelo de Negocio.

**Pregunta abierta para v1.0:** ¿Hay trial gratuito? ¿Donde va el paywall?

---

## 2. Experimentos de Pricing Propuestos

### Experimento A: Trial 14 dias — Full access

**Configuracion:**
- Nuevos usuarios tienen 14 dias de acceso completo (como plan Builder: 2 proyectos, fases 00–06, 7 agentes)
- No requiere tarjeta para empezar
- Al dia 12: recordatorio por email con CTA a suscribirse
- Al dia 14: acceso bloqueado hasta que pague o downgrade a plan gratuito (si existe)

**Paywall triggers:**
- Al intentar crear 3er proyecto (si ya tiene 2)
- Al intentar acceder a Phase 05+ (si ya paso el trial)
- Banner persistente en dashboard desde dia 12: "Quedan X dias de tu trial. Elige tu plan."

**Ventajas:** Maximiza conversion; el usuario prueba el valor real antes de pagar.
**Riesgos:** Usuarios que consumen y no convierten. Costo de LLM durante trial.

---

### Experimento B: Freemium — Paywall en Phase 01

**Configuracion:**
- Plan gratuito permanente: 1 proyecto, Phase 00 completa, Phase 01 bloqueada
- El usuario puede completar todo el discovery (5 documentos) sin pagar
- Paywall al intentar entrar a Phase 01 (Generador KIRO) o al chat con agentes
- Trial de 7 dias de Builder al convertir (para probar Phase 01 antes de compromiso mensual)

**Paywall triggers:**
- Boton "Continuar a Phase 01" muestra modal con planes y precios
- Chat con agentes: solo disponible con plan de pago
- Sin limite de tiempo para Phase 00 — puede iterar indefinidamente en discovery

**Ventajas:** Bajo riesgo para el usuario; fuerte hook de valor (tiene brief listo, quiere especificar).
**Riesgos:** Algunos completan Phase 00 y nunca pagan (churn en funnel).

---

### Experimento C: Híbrido (recomendado para v1.0)

**Configuracion:**
- **Trial 7 dias** con acceso completo (como Builder)
- **Plan gratuito post-trial:** 1 proyecto, Phase 00 + Phase 01 primera feature
- Paywall al intentar: segunda feature KIRO, Phase 02+, o chat con agentes especializados (solo CTO Virtual en free)

**Logica:**
- El usuario valida el flujo end-to-end en 7 dias sin friccion
- Si no convierte, pasa a free con 1 proyecto y puede completar discovery + 1 feature spec
- Para seguir construyendo (mas features, agentes, fases) necesita plan de pago

**Paywall triggers:**
- Crear segunda feature en Phase 01
- Acceder a Phase 02 o superior
- Seleccionar agente distinto a CTO Virtual en /projects/:id/agents
- Crear segundo proyecto (en free post-trial)

---

## 3. Reflexion en la UI

### Durante onboarding

| Paso | Experimento A | Experimento B | Experimento C |
|-----|---------------|---------------|---------------|
| Paso 1 (Bienvenida) | "14 dias gratis — construye lo que imagines" | "Empieza gratis. Paga cuando quieras especificar." | "7 dias gratis. Luego elige tu plan." |
| Paso 3 (Proyecto) | "Desde interfaces hasta productos con IA — construye cualquier solucion" | "Completa tu discovery gratis" | "Crea tu proyecto y explora 7 dias sin limites" |
| Paso 4 (Fases) | Mencion trial 14 dias | Mencion que Phase 01 requiere plan | Mencion trial 7 dias + opcion free |

### Banners y mensajes

| Ubicacion | Experimento A | Experimento B | Experimento C |
|-----------|---------------|---------------|---------------|
| Dashboard | "Trial: X dias restantes" (dia 12+) | "Phase 00 completada. Desbloquea Phase 01" (si en free) | "Trial: X dias" o "Plan free: 1 feature KIRO restante" |
| Phase 00 | Sin banner | Sin banner | Banner si queda < 3 dias de trial |
| Phase 01 (entrada) | — | Modal paywall | — |
| Phase 01 (2da feature) | — | — | Modal paywall |
| Chat agentes | — | Modal paywall | Modal si selecciona agente != CTO |

### Modal de paywall — estructura comun

```
┌─────────────────────────────────────────────────┐
│  Para continuar necesitas un plan               │
│                                                  │
│  [Starter $149] [Builder $299] [Agency $699]    │
│                                                  │
│  • Starter: 1 proyecto, fases 00-04             │
│  • Builder: 2 proyectos, fases 00-06, 7 agentes │
│  • Agency: 5 proyectos, multi-cliente           │
│                                                  │
│  [Comparar planes]  [Cerrar]                    │
└─────────────────────────────────────────────────┘
```

### Variables de configuracion

Para cambiar de experimento sin redeploy:

```
PLAN_TRIAL_DAYS=7 | 14 | 0
PLAN_FREE_PHASE_00=true | false
PLAN_FREE_PHASE_01_FEATURES=0 | 1
PLAN_FREE_AGENTS=cto_only | none
```

---

## 4. Criterios de decision

| Criterio | Peso | Experimento A | Experimento B | Experimento C |
|----------|------|---------------|---------------|----------------|
| Conversion trial → pago | Alto | ? | Bajo (muchos free forever) | Medio |
| Time-to-value percibido | Medio | Alto | Medio (Phase 00 gratis) | Alto |
| Complejidad de implementacion | Bajo | Baja | Media (logica paywall en Phase 01) | Media |
| Riesgo de abuso (uso sin pagar) | Medio | Bajo (14 dias max) | Alto | Medio |
| Alineado con "empezar sin miedo" (Camila) | Alto | Si | Si (Phase 00 gratis) | Si |

**Recomendacion inicial:** Experimento C (hibrido) — balance entre conversacion y valor demostrado. Re-evaluar a los 30 dias con datos de conversion.

---

## 5. Implementacion Tecnica

### Tabla `user_plans` (extension)

```sql
-- Campos relevantes para pricing
user_id, plan_type, trial_ends_at, subscription_id (Stripe, futuro)
```

### Guards en middleware / server

- `canAccessPhase(phase)` — segun plan y trial_ends_at
- `canCreateProject()` — segun limite de proyecto
- `canUseAgent(agent_type)` — CTO siempre; otros segun plan
- `canCreateFeatureInPhase01()` — segun limite de features en free

### UI components

- `PaywallModal` — reutilizable, recibe `trigger` (phase, agent, project_limit)
- `TrialBanner` — muestra dias restantes, link a planes
- `PlanGuard` — wrapper que muestra paywall o children segun permisos

---

## 6. Proximos pasos

1. CEO/CPO elige experimento inicial (A, B o C)
2. Agregar tareas de pricing a `docs/specs/auth-onboarding/tasks.md` o crear spec dedicado
3. Integracion con Stripe en v1.1 (MoSCoW: Could Have)
4. Para v1.0 sin Stripe: considerar "Request access" o waitlist para simular conversion
