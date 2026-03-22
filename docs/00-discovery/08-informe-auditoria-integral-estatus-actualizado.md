# Estatus actualizado — Informe de auditoría integral

**Documento base:** `docs/informe-auditoria-integral.pdf` / `docs/informe-auditoria-integral.html`  
**Versión del informe original:** 0.1.0 · **Fecha del informe:** 16 de marzo de 2026  
**Estatus consolidado en código/docs:** 8 de marzo de 2026  

Este archivo **no sustituye** el PDF/HTML del informe; es un **delta estructurado**: qué sigue vigente, qué cambió en el producto desde la auditoría y qué gaps del informe siguen abiertos.

---

## 1. Resumen ejecutivo (delta)

| Área | Estado en informe (16-mar-2026) | Estado actualizado |
|------|----------------------------------|---------------------|
| **Propósito del producto** | MVP funcional, 8 fases + 9 agentes | **Se mantiene**; se reforzó la **coherencia narrativa** (CTO como interfaz principal en el flujo por fases). |
| **Base de datos** | 16 migraciones SQL | **18 migraciones** (`017_ai_usage_and_admin_role`, `018_fix_feature_documents_rls_insert`). |
| **Monetización (Stripe)** | Parcial / gaps críticos | **Sigue en riesgo operativo**: no hay dependencia `stripe` en `package.json`; checkout/webhook siguen siendo área a endurecer (como en el informe). |
| **Control financiero / costos IA** | No cubierto en profundidad en el informe | **Nuevo**: tabla `ai_usage_events`, rol `financial_admin`, APIs `/api/admin/finance/*`, UI `/admin/finance`, doc `06-plan-financiero-unit-economics.md` y `07-backoffice-financiero.md`. |
| **Orquestación de agentes** | 9 agentes + chat | **Evolución**: consultas internas (modelo “opción B”) en fases 00–03 y primer mensaje del CTO en fases 04–07; página **Experts** (`/projects/[id]/experts`) para uso directo de especialistas. |
| **Phase 01 (KIRO)** | Completado a nivel UI/API | **Endurecido**: generación de documentos con mejor manejo de errores/timeouts, `upsert` de `feature_documents` con cliente **service-role** en servidor, migración RLS `018` para `INSERT/UPSERT`. UX: chat/panel menos ruidoso. |
| **CI/CD en repo** | Informe menciona copiar `ci.yml` a `.github/workflows/` | **Sigue pendiente** en raíz: el workflow vive en `infrastructure/github/workflows/ci.yml` (no hay `.github/workflows/` en el árbol principal). |
| **Seed / demo / Resend** | Pendiente | **Sin cambio confirmado en código** como “cerrado”; sigue como gap de producto/onboarding. |

---

## 2. Inventario técnico — correcciones al informe

### 2.1 Migraciones Supabase

- **Informe:** “16 migraciones”.  
- **Actual:** **18 archivos** en `infrastructure/supabase/migrations/` (incluye uso de IA + admin y fix RLS de `feature_documents`).

### 2.2 API Routes

- **Informe:** “32+ endpoints”.  
- **Actual:** el conteo sube por las rutas nuevas de **admin financiero** (`overview`, `users/[userId]`) y lógica asociada; conviene **recalcular** en una próxima pasada automatizada si se versiona un informe 0.2.0.

### 2.3 Supabase / RLS

- El informe afirma RLS en tablas sensibles; **sigue siendo cierto**.  
- **Nuevo matiz:** se detectó fricción en **`feature_documents`** con políticas que dificultaban `INSERT/UPSERT`; la migración **018** alinea `WITH CHECK` con el uso real de la app.  
- **Operación en producción:** conviene **aplicar 017 y 018** en todos los entornos (staging/prod) y verificar que `SUPABASE_SERVICE_ROLE_KEY` esté definida en Vercel para rutas que usan cliente admin (solo servidor).

---

## 3. Producto y experiencia — alineación con la “razón de ser”

**Razón de ser declarada:** metodología IA DLC + equipo de agentes que guía de discovery a iteración.

**Avances desde el informe (percepción y flujo):**

- Menos dispersión entre “muchas cabezas visibles” y más **CTO orquestador** en el camino feliz por fase.  
- **Experts** explícitos para usuarios avanzados (no mezclar con el flujo núcleo).  
- **Backoffice financiero** alineado con un SaaS cuyo costo variable principal es **tokens de IA**.

**Brechas que el informe ya insinuaba y que siguen relevantes:**

- Fases **04–07** siguen siendo más “checklist + chat” que **entregables tan ricos** como Phase 01; la sensación de “squad completo” depende mucho de la calidad del prompt y del contexto inyectado, no de automatización en repo.  
- **Monetización** y **emails** siguen siendo palancas de confianza y retención; sin cerrarlas, el informe sigue siendo válido en su sección de gaps críticos.

---

## 4. Estado de los gaps del informe (checklist)

### Críticos (monetización / seguridad billing)

| # | Gap (informe) | ¿Cerrado? | Nota |
|---|----------------|-----------|------|
| 1 | Stripe SDK vs HTTP crudo | **No** | `package.json` sin `stripe`. |
| 2 | Productos/precios en Stripe Dashboard | **Operacional** (fuera de repo) | Depende del entorno. |
| 3 | Verificación de firma webhook | **Revisar código** | El informe marcaba riesgo; prioridad sigue alta. |
| 4 | Variables Stripe en Vercel | **Operacional** | Sin validación desde aquí. |

### Importantes (UX / operaciones)

| # | Gap (informe) | ¿Cerrado? | Nota |
|---|----------------|-----------|------|
| 5 | Seed / demo project | **No** (no documentado como hecho) | Pendiente. |
| 6 | Customer Portal Stripe | **No** | Pendiente. |
| 7 | Resend / emails transaccionales | **No** | Pendiente. |
| 8 | CI en `.github/workflows/` | **No** | Workflow sigue bajo `infrastructure/github/workflows/`. |

### Nuevos ítems (post-informe)

| Ítem | Descripción | Estado |
|------|-------------|--------|
| N1 | **Persistencia Phase 01** (generación de documentos) | Mejorado en código; validar en prod con migraciones + `SUPABASE_SERVICE_ROLE_KEY`. |
| N2 | **Costos por usuario** (`ai_usage_events` + backoffice) | Implementado en app; requiere datos reales y asignación de rol `financial_admin`. |

---

## 5. Recomendación para la siguiente versión del informe (v0.2.0)

1. Regenerar métricas (LOC, # componentes, # endpoints) con script o `cloc` + listado de `src/app/api`.  
2. Actualizar sección **Base de datos** a **18 migraciones** y describir `ai_usage_events` + roles.  
3. Añadir sección **Finanzas / unit economics** (refs a `docs/00-discovery/06-*.md` y `07-*.md`).  
4. Actualizar **Sistema de agentes** con modelo **CTO + consultas internas + Experts**.  
5. Cerrar o explicitar estado de **Stripe** con evidencia en repo (`package.json`, rutas `billing`).  
6. Exportar de nuevo **PDF** desde el HTML actualizado (si se mantiene ese formato).

---

## 6. Trazabilidad

| Artefacto | Ubicación |
|-----------|-----------|
| Informe original (HTML) | `docs/informe-auditoria-integral.html` |
| Informe original (PDF) | `docs/informe-auditoria-integral.pdf` |
| Este estatus | `docs/00-discovery/08-informe-auditoria-integral-estatus-actualizado.md` |

---

*Documento de seguimiento generado para alinear stakeholders con el estado real del repositorio respecto al informe de auditoría del 16 de marzo de 2026.*
