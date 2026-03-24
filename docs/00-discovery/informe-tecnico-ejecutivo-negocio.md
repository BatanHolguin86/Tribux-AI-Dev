# Informe técnico ejecutivo de negocio — AI Squad Command Center

**Audiencia:** dirección de producto, inversión y stakeholders no técnicos que necesitan síntesis con rigor.  
**Fecha:** marzo 2026  
**Fuentes:** `docs/ESTADO-DEL-PRODUCTO.md`, `docs/00-discovery/01-brief.md`, `docs/00-discovery/estatus-v1-y-roadmap.md`, `docs/05-qa/v1-go-no-go.md`, `docs/06-ops/v1-release.md`.

---

## 1. Qué es el producto (negocio)

**AI Squad Command Center** es una plataforma **SaaS B2B** orientada a **founders, PMs y consultores** que tienen claridad de negocio pero no un equipo técnico completo. El producto los posiciona como **CEO/CPO** de un **equipo de agentes de IA especializados** que ejecutan bajo su supervisión un proceso estructurado (**IA DLC**, ocho fases), desde la idea hasta el lanzamiento y la iteración.

**Problema que ataca:** brecha entre visión de negocio y ejecución técnica (coste de equipo, lentitud, pérdida de control, calidad impredecible).

**Propuesta de valor resumida:** metodología + IA + documentación persistente + gates de aprobación humana, frente a no-code que no escala, generadores de código sin proceso o agencias caras.

**Personas y monetización (brief):** cuatro arquetipos (founder no técnico, PM senior, consultor/agencia, emprendedora digital) con rangos de ARPU indicativos en brief; **MVP centrado en founder no técnico**.

---

## 2. Qué hace hoy el producto (técnico-funcional)

| Capa | Estado (marzo 2026) | Comentario ejecutivo |
| ---- | -------------------- | -------------------- |
| **Identidad y proyectos** | Operativo | Auth Supabase, onboarding, dashboard, proyecto por fases 00–07. |
| **Fase 00 — Discovery** | Operativo | Chat guiado por secciones, generación de documentos, aprobaciones y cierre de fase. |
| **Fase 01 — KIRO** | Operativo | Features, specs (requirements / design / tasks), coherencia, aprobaciones; flujo principal de “pensar antes de construir”. |
| **Fase 02 — Arquitectura y diseño en app** | Operativo | Hub **Diseño & UX** integrado: **Camino A** (pantallas HTML generadas y persistidas) y **Camino B** (kit con agente UI/UX en conversación). Enlace con Phase 04 (diseños aprobados). |
| **Equipo de agentes** | Operativo | CTO + especialistas + Operator (según plan); hilos, streaming, sugerencias, **adjuntos** en Storage; límites por **plan** (Starter vs superior). |
| **Fases 03–07 — Construir y lanzar** | Operativo (esqueleto productivo) | Progreso visible, **checklists persistidos** (ítems por categoría en 03/05/06/07; Kanban en 04), enlaces a documentación QA/ops, narrativa de cierre en dashboard y proyecto. Parte del trabajo sigue siendo **manual o externo** (CI, consolas cloud). |
| **Facturación** | Opcional | Stripe según configuración de entorno. |

**Stack de referencia:** Next.js (App Router), TypeScript, Supabase (Auth, PostgreSQL, Storage), despliegue típico en **Vercel**, modelo de lenguaje **Anthropic** vía API.

---

## 3. Diferenciación defendible

1. **Proceso empaquetado (IA DLC + KIRO)** — no es solo “chat con IA”: hay fases, entregables y aprobaciones.
2. **Spec-driven** — reduce ambigüedad antes de construir.
3. **Diseño en producto** — wireframes/mockups persistidos y flujo de aprobación hacia desarrollo.
4. **Conocimiento en el proyecto** — documentos y hilos, no solo conversaciones efímeras.
5. **Control del usuario** — gates explícitos; la IA asiste, el humano decide en hitos clave.

---

## 4. Riesgos y dependencias (lectura ejecutiva)

| Riesgo / dependencia | Impacto en negocio | Mitigación en producto/docs |
| -------------------- | ------------------ | --------------------------- |
| **API de IA y coste** | Sin clave o sin créditos, el valor central se degrada | Mensajes de error explícitos en UI; go/no-go exige validar entorno |
| **Supabase (datos + Storage)** | Migraciones o buckets faltantes rompen features | Runbooks, migración `021` para checklists por ítem, guía `v1-release.md` |
| **Expectativa “todo automático”** | Desalineación con 03–07 | Narrativa en app: construcción/lanzamiento combinan app + trabajo externo |
| **Calidad percibida de salidas IA** | Afecta retención y NPS | Metodología por fases, aprobaciones humanas, specs KIRO |

---

## 5. Madurez y cierre v1.0

- **Roadmap interno:** Fases **A, B y C** cerradas (estabilidad de errores de IA, hub diseño, esqueleto “construir + lanzar” con persistencia y narrativa).
- **Fase D (cierre v1.0):** documentación de **release** publicada (`docs/06-ops/v1-release.md`). Pendiente: **revisión go/no-go** con usuario real en el despliegue de referencia (p. ej. Vercel Production), evidencia registrada en `docs/05-qa/v1-go-no-go.md`, y decisión explícita de **lanzamiento** o beta.
- **Tests:** suite automatizada amplia (unitarios + integración); E2E documentados; criterios locales de typecheck, lint, test y build reflejados en go/no-go.

---

## 6. Conclusión para decisión

El producto **cumple la promesa central de “diseñar y especificar con método + agentes”** de forma **implementada y desplegable**, y ofrece un **camino reconocible de construcción y lanzamiento (03–07)** con seguimiento en producto, sin ocultar que parte del trabajo ocurre fuera de la app.

**Recomendación típica de siguiente paso de negocio:** completar **Fase D** (validación humana en el entorno productivo, registro en go/no-go, criterios de lanzamiento) y fijar **métricas post-lanzamiento** alineadas con `docs/00-discovery/04-metrics.md` según prioridad estratégica.

---

_Documento de síntesis; el detalle vivo del código y rutas está en `docs/ESTADO-DEL-PRODUCTO.md`._
