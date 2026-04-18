# Plan financiero, estructura de costos y unit economics — Tribux

**Versión:** 1.0  
**Fecha:** 2026-03  
**Objetivo:** Establecer modelo de costos y precios rentables desde el primer día, con el core en créditos Anthropic/OpenAI.

---

## 1. Resumen ejecutivo

- **Core variable:** Costo de tokens de IA (Anthropic Claude Sonnet u OpenAI equivalente) por usuario/proyecto.
- **Objetivo:** Margen bruto por plan ≥ 60% desde el lanzamiento; LTV/CAC > 3x en Mes 3.
- **Palancas:** Límites de uso por plan, truncamiento de contexto, caché donde aplique, y precios que cubran coste medio de IA + margen.

---

## 2. Estructura de costos

### 2.1 Costos fijos (mensual, aproximados)

| Concepto                         | Estimación v1.0 | Notas                       |
| -------------------------------- | --------------- | --------------------------- |
| Vercel (Pro/hosting)             | $20–80          | Según tráfico               |
| Supabase (Pro)                   | $25–50          | DB, Auth, Storage           |
| Dominio, email (Resend)          | $10–30          |                             |
| Herramientas (Sentry, analytics) | $0–50           | Planes free/low             |
| **Total fijos**                  | **$55–210/mes** | Escala con equipo y tráfico |

### 2.2 Costo variable principal: IA (Anthropic / OpenAI)

Referencia de precios **Anthropic Claude Sonnet 4** (por millón de tokens, redondeado):

|            | Input | Output |
| ---------- | ----- | ------ |
| **$/MTok** | $3    | $15    |

Equivalencia aproximada: **1 MTok ≈ 750.000 palabras**; mensajes típicos: ~200–500 tokens input, 500–2000 output por intercambio.

**Uso de IA en el producto (por evento):**

| Evento                                       | Input aprox. (tokens) | Output aprox. (tokens) | Coste aprox. por evento (USD) |
| -------------------------------------------- | --------------------- | ---------------------- | ----------------------------- |
| Mensaje chat agente (1 turno)                | 3.000–15.000          | 500–2.000              | $0,02–0,06                    |
| Generar doc Phase 00 (1 sección)             | 2.000–8.000           | 1.000–4.000            | $0,02–0,08                    |
| Generar doc KIRO (requirements/design/tasks) | 5.000–20.000          | 2.000–8.000            | $0,05–0,18                    |
| Generar diseño (wireframe/mockup)            | 4.000–12.000          | 1.000–4.000            | $0,03–0,10                    |
| Título de hilo                               | 500–2.000             | 20–50                  | <$0,01                        |
| Sugerencias proactivas (1 llamada)           | 2.000–8.000           | 200–500                | $0,01–0,03                    |

**Coste mensual estimado por usuario activo (uso “normal”):**

- **Starter (solo CTO Virtual):** ~20–50 mensajes/mes + algo de Phase 00 → **$2–6/usuario/mes** en IA.
- **Builder (todos los agentes + Phase 00–02 + diseños):** ~80–150 mensajes + docs + diseños → **$8–18/usuario/mes** en IA.
- **Agency (más proyectos y agentes):** ~200–400 mensajes equivalentes → **$20–45/usuario/mes** en IA.

Estas bandas sirven para definir **límites de uso y precios mínimos** por plan.

---

## 3. Unit economics por plan

Precios actuales (de `docs/01-specs/06-pricing-experiments.md` y `04-metrics.md`):

| Plan    | Precio/mes | Proyectos | Agentes                        |
| ------- | ---------- | --------- | ------------------------------ |
| Starter | $49        | 1         | CTO + Product Architect + UI/UX |
| Builder | $149       | 1         | Todos (8)                      |
| Pro     | $299       | 3         | Todos (8), todas las fases     |
| Agency  | $699       | 10        | Todos + multi-cliente          |

**Objetivo de margen bruto:** Coste de IA ≤ 25–35% del revenue por plan, para dejar margen a costes fijos, CAC y beneficio.

| Plan    | Precio | Coste IA obj. (30%) | Coste IA max. por usuario/mes | Margen bruto obj. |
| ------- | ------ | ------------------- | ----------------------------- | ----------------- |
| Starter | $49    | ≤ ~$14.70           | $14.70                        | ~70%              |
| Builder | $149   | ≤ ~$44.70           | $44.70                        | ~70%              |
| Pro     | $299   | ≤ ~$89.70           | $89.70                        | ~70%              |
| Agency  | $699   | ≤ ~$209.70          | $209.70                       | ~70%              |

**Conclusión:** Con las bandas de uso “normal” anteriores, los precios actuales son compatibles con **margen bruto > 60%** siempre que:

- El coste real de IA por usuario se mantenga dentro de las bandas indicadas (Starter &lt; ~$14.70, Builder &lt; ~$44.70, Pro &lt; ~$89.70, Agency &lt; ~$209.70).
- Se apliquen **límites y guardas** (véase sección 5) para evitar abusos.

---

## 4. Escalabilidad y eficiencias

### 4.1 Ya implementado o en código

- **Truncamiento de contexto:** `applyProgressiveTruncation` y tope en `getApprovedFeatureSpecs` limitan el tamaño del prompt → menos input tokens.
- **Rate limiting:** Diseño y chat de agentes tienen (o pueden tener) límite de solicitudes por usuario/tiempo.
- **Un solo modelo por flujo:** Uso consistente de Sonnet para chat/docs mantiene costes predecibles.

### 4.2 Recomendaciones para v1.0

- **Límites por plan (cuotas mensuales):**
  - Starter: ej. 50 mensajes de agente/mes + Phase 00 ilimitada en secciones.
  - Builder: ej. 200 mensajes/mes + N generaciones de documentos KIRO + M diseños.
  - Agency: límites más altos o “ilimitado razonable” con alertas.
- **Prompt caching (Anthropic):** Si el mismo contexto de proyecto se reutiliza en muchas llamadas, evaluar cache de sistema para reducir input recurrente.
- **Monitoreo:** Registrar tokens consumidos por `project_id` y por `user_id` (o por plan) para ajustar cuotas y precios con datos reales.

### 4.3 Escalabilidad de coste

- Coste variable crece con **uso real** (mensajes, documentos, diseños), no con número de usuarios inactivos.
- Costes fijos crecen con tráfico y features (más Vercel, más Supabase), pero se reparten entre más usuarios de pago.
- A medio plazo: si el coste por usuario activo baja (mejor truncamiento, cache, modelos más baratos), el margen mejora sin subir precios.

---

## 5. Modelo de costos y precios rentables desde el día 1

### 5.1 Reglas operativas

1. **Precios actuales ($49 / $149 / $299 / $699)** se mantienen como referencia; el coste de IA por usuario debe quedar por debajo del 30–35% del precio para margen bruto ≥ 60%.
2. **Límites de uso por plan:** Definir cuotas mensuales de mensajes de agentes (y opcionalmente de generaciones de documentos/diseños) y mostrarlas en UI o en condiciones de uso; si se superan, upgrade o mensaje claro.
3. **Trial:** Si hay trial (7 o 14 días), acotar a un número máximo de mensajes o de proyectos para que el coste medio por trialista esté acotado (ej. &lt; $5–10 por trialista).
4. **Enterprise:** Precio y límites negociados; idealmente coste de IA + margen explícito en el contrato.

### 5.2 Métricas a seguir

- **Coste de IA por usuario activo y por plan** (mensual).
- **Revenue por usuario (ARPU)** por plan.
- **Margen bruto** = (Revenue − Coste IA − otros variables) / Revenue.
- **LTV/CAC** con CAC objetivo &lt; $150 (Mes 3) y LTV según retención por plan.

### 5.3 Ajustes si el coste se dispara

- Reducir `maxTokens` en flujos menos críticos (ej. sugerencias, títulos).
- Endurecer truncamiento (reducir `maxFeatureSpecsChars`, etc.).
- Subir precios o bajar cuotas en nuevos clientes (los ya contratados según términos).

---

## 6. Resumen: rentabilidad desde el lanzamiento

- **Estructura de costos:** Fijos bajos (Vercel, Supabase, etc.); variable dominante = tokens Anthropic/OpenAI.
- **Unit economics:** Con precios $49 / $149 / $299 / $699 y coste de IA por usuario dentro de las bandas indicadas, el margen bruto puede ser ≥ 60–70% desde el día 1.
- **Escalabilidad:** Coste escala con uso real; mejoras de producto (truncamiento, cache, cuotas) mejoran margen sin subir precios.
- **Acción inmediata:** Definir e implementar cuotas por plan (mensajes/mes, generaciones/mes) y dashboard o logs de coste de IA por usuario/proyecto para validar y afinar estos números con datos reales.
