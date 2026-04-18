# Modelo de Pricing v1.0 — Tribux AI

**Fecha:** 2026-04-18 (actualizado)

---

## 1. Estructura de ingresos

### Planes mensuales (recurrente)

| Plan | Precio | Proyectos | Agentes | Budget IA | Margen target |
|------|--------|-----------|---------|-----------|---------------|
| **Starter** | $49/mes | 1 | CTO + Product Architect + UI/UX | $14.70 | 70% |
| **Builder** | $149/mes | 1 | 8 agentes | $44.70 | 70% |
| **Pro** | $299/mes | 3 | 8 agentes, todas las fases | $89.70 | 70% |
| **Agency** | $699/mes | 10 | 8 agentes + multi-client | $209.70 | 70% |
| **Enterprise** | Custom | Ilimitados | Todo + SLA | $500+ | 70% |

### Creditos adicionales (one-time top-up)

Cuando un usuario supera su budget mensual, puede comprar creditos extras:

| Pack | Precio | Budget IA agregado | ~Builds extra |
|------|--------|-------------------|---------------|
| Small | $25 | $25 | ~15 |
| Medium | $50 | $50 | ~30 |
| Large | $100 | $100 | ~60 |

Los creditos se aplican al mes corriente. No se acumulan al siguiente mes.

---

## 2. Costos reales por operacion (Claude Sonnet 4.6)

**Pricing Anthropic:** Input $3/MTok, Output $15/MTok

| Operacion | Input tokens | Output tokens | Costo USD |
|-----------|-------------|---------------|-----------|
| Chat agente (1 turno) | 3K-15K | 500-2K | $0.02-0.06 |
| Documento discovery (Phase 00) | 4K-8K | 1K-4K | $0.03-0.08 |
| Spec KIRO (requirements/design/tasks) | 5K-20K | 2K-8K | $0.05-0.18 |
| Documento arquitectura (Phase 02) | 8K-15K | 4K-8K | $0.08-0.17 |
| Wireframe/mockup | 4K-12K | 1K-4K | $0.03-0.10 |
| **Auto-build (1 task, 25 steps)** | **175K** | **75K** | **$1.65** |
| Code review (post-build) | 6K | 2K | $0.05 |
| Design review (post-build) | 4K | 500 | $0.02 |
| Test generation (unit/e2e) | 12K | 6K | $0.13 |
| Deploy workflow | 10K | 6K | $0.12 |
| Titulo de thread | 500 | 50 | <$0.01 |
| Sugerencias proactivas | 2K-8K | 200-500 | $0.01-0.03 |

---

## 3. Costo por proyecto completo (1 ciclo IA DLC)

| Fase | Operaciones | Costo estimado |
|------|------------|----------------|
| Phase 00 — Discovery | 5 secciones (chat + doc) | $0.52 |
| Phase 01 — Specs | 2 features × 3 docs KIRO | $0.60 |
| Phase 02 — Arquitectura | 4 docs + chat | $0.68 |
| Phase 03 — Infra | scaffold + DB + auth + env | $0.75 |
| Phase 04 — Desarrollo (10 tasks) | 10 auto-builds + reviews | $17.00 |
| Phase 04 — Desarrollo (20 tasks) | 20 auto-builds + reviews | $34.00 |
| Phase 05 — Testing | plan + unit + e2e + CI + QA | $0.63 |
| Phase 06 — Launch | deploy + runbook | $0.24 |
| Phase 07 — Iteracion | analysis + backlog + retro | $0.27 |
| Chat agentes (transversal) | ~30 turnos | $1.35 |
| **TOTAL (10 tasks)** | | **~$22** |
| **TOTAL (20 tasks)** | | **~$39** |

> Phase 04 (auto-build) representa el **75-85% del costo total**.

---

## 4. Consumo por user persona

### Camila (emprendedora) — Plan Starter $49/mes

- **Perfil:** 1 proyecto, uso moderado, Phases 00-02
- **Tasks por proyecto:** 0 (no incluye auto-build)
- **Chat:** 15-25 turnos/mes
- **Costo IA real:** $4-10/mes
- **Budget disponible:** $14.70
- **Margen real:** 80-92%
- **Top-up probable:** Raro (uso ligero)

### Santiago (founder tecnico) — Plan Builder $149/mes

- **Perfil:** 1 proyecto, iteraciones frecuentes, usa todos los agentes
- **Tasks por proyecto:** 10 (auto-build incluido)
- **Chat:** 40-80 turnos/mes
- **Costo IA real:** $20-35/mes
- **Budget disponible:** $44.70
- **Margen real:** 77-87%
- **Top-up probable:** Ocasional en meses de desarrollo intenso

### Valentina (PM) — Plan Pro $299/mes

- **Perfil:** 2-3 proyectos, mas specs que codigo, heavy en todas las fases
- **Tasks por proyecto:** 10-15
- **Chat:** 50-100 turnos/mes
- **Costo IA real:** $30-50/mes
- **Budget disponible:** $89.70
- **Margen real:** 83-90%
- **Top-up probable:** Raro

### Rodrigo (consultor) — Plan Agency $699/mes

- **Perfil:** 5-8 proyectos (clientes), delegacion a agentes, ciclos rapidos
- **Tasks por proyecto:** 10-15
- **Chat:** 100-200 turnos/mes
- **Costo IA real:** $80-150/mes
- **Budget disponible:** $209.70
- **Margen real:** 79-89%
- **Top-up probable:** 1-2 top-ups/mes en meses pico ($25-50)

---

## 5. Costos de infraestructura (por proyecto de usuario)

Estos son los costos que el USUARIO de Tribux AI genera en las 3 plataformas master:

| Servicio | Free tier | Limite free | Costo si excede |
|----------|-----------|-------------|-----------------|
| GitHub (repo privado) | Ilimitado en org | N/A | $0 |
| Supabase (proyecto) | 2 proyectos/org | 500MB DB, 1GB storage | $25/mes (Pro) |
| Vercel (proyecto) | 3 proyectos/team | 100GB bandwidth | $20/mes (Pro) |

**Costo operativo por usuario en free tier:** $0
**Costo cuando se exceden free tiers:** ~$45-65/mes/usuario activo

> Los free tiers de las 3 plataformas cubren los primeros 2-3 proyectos por usuario sin costo adicional para Tribux AI.

---

## 6. Costos de operacion de Tribux AI (la plataforma)

| Recurso | Costo mensual |
|---------|--------------|
| Supabase (DB del producto) | $25 |
| Vercel (hosting del producto) | $20 |
| Dominio | $1 |
| Sentry (free tier) | $0 |
| Resend (free tier) | $0 |
| **Total base** | **$46/mes** |

Breakeven: 1 usuario Builder ($149) cubre los costos de plataforma con margen.

---

## 7. Flujo de monetizacion

```
Usuario usa Tribux AI
    │
    ├─ Plan mensual ($49-699) → ingreso recurrente
    │
    ├─ Consumo normal (< budget) → margen 70-92%
    │
    ├─ Consumo excede budget → opciones:
    │   ├─ Comprar creditos ($25-100) → ingreso one-time
    │   ├─ Upgrade de plan → mayor ingreso recurrente
    │   └─ Esperar al proximo mes → sin ingreso extra
    │
    └─ Overage billing (opcional) → cargo 1.5x automatico via Stripe
```

---

## 8. Metricas clave a monitorear

| Metrica | Formula | Target |
|---------|---------|--------|
| Gross margin | (Revenue - AI Cost) / Revenue | ≥ 70% |
| Budget utilization | Avg(usedUsd / budgetUsd) | 30-60% |
| Top-up frequency | Top-ups / usuarios activos / mes | < 15% |
| Upgrade conversion | Upgrades / quota_exceeded events | > 20% |
| Overage per user | Avg overage por usuario con excedente | < $30 |
| CAC payback | Plan price / CAC | < 3 meses |
| LTV | ARPU × avg lifetime months | > 3× CAC |

---

## 9. Implementacion tecnica

| Componente | Archivo | Estado |
|------------|---------|--------|
| Plan budgets | `infrastructure/supabase/migrations/027_plan_cost_targets.sql` | ✅ |
| AI usage tracking | `src/lib/ai/usage.ts` + `017_ai_usage_and_admin_role.sql` | ✅ |
| Quota enforcement | `src/lib/plans/quota.ts` | ✅ |
| Credit purchases | `infrastructure/supabase/migrations/035_credit_purchases.sql` | ✅ NEW |
| Top-up API | `src/app/api/billing/top-up/route.ts` | ✅ NEW |
| Top-up webhook | `src/app/api/billing/webhook/route.ts` | ✅ Updated |
| Quota exceeded modal | `src/components/shared/QuotaExceededModal.tsx` | ✅ NEW |
| Sidebar usage widget | `src/components/dashboard/SidebarUsageWidget.tsx` | ✅ NEW |
| Usage banner | `src/components/shared/UsageQuotaBanner.tsx` | ✅ Updated |
| Billing upgrade flow | `src/components/settings/BillingSection.tsx` | ✅ Updated |
| Overage billing | `src/lib/plans/overage.ts` + `029_overage_billing.sql` | ✅ |
| Admin finance dashboard | `src/app/api/admin/finance/overview/route.ts` | ✅ |
| Project cost dashboard | `src/components/costs/ProjectCostDashboard.tsx` | ✅ |
