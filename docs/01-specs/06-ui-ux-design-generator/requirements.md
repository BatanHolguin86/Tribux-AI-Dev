# Requirements: Generador de diseños UI/UX

**Feature:** Generador de diseños UI/UX (wireframes y mockups) + hub Diseño & UX
**Fase IA DLC:** Phase 02 — Architecture & Design (integrado)
**Fecha:** 2026-03-08 · revisión hub: marzo 2026
**Status:** En evolución — ver `design.md` y ADR-007

---

## User Stories

### Hub Diseño & UX (dos caminos)

- Como usuario, quiero ver **dos caminos claros** en `/projects/[id]/designs` (pantallas guardadas vs. conversaciones con el agente para kit de diseño), para saber qué acción tomar en cada momento.
- Como usuario, quiero que el **breadcrumb** refleje si estoy en una fase, en Diseño & UX o viendo un artefacto, para no perder el contexto de navegación.
- Como usuario, quiero que el agente UI/UX reciba **personas y propuesta de valor** del Discovery aprobado al abrir una herramienta del kit, para que los entregables estén alineados al negocio.

### Generación de diseños

- Como Founder o PM, quiero generar wireframes a partir del design.md y los user flows ya definidos en Phase 01, para tener una referencia visual antes de desarrollar y alinear al equipo.
- Como usuario, quiero generar mockups (low-fi o high-fi) para las pantallas clave de mi producto, para validar la experiencia con stakeholders o para guiar al desarrollador.
- Como usuario, quiero poder pedir al agente UI/UX Designer que refine o itere un diseño (por ejemplo “más minimalista” o “enfatizar el CTA”), para ajustar el resultado sin reescribir el spec desde cero.
- Como usuario, quiero que los diseños se generen en el contexto de mi proyecto (nombre, industria, descripción), para que el estilo y el tono sean coherentes con mi producto.

### Visualización y organización

- Como usuario, quiero ver todos los wireframes y mockups del proyecto en un solo lugar (p. ej. docs/design o vista “Diseño” en el proyecto), para acceder rápido y compartir con el equipo.
- Como usuario, quiero que cada diseño esté asociado a una pantalla o flujo concreto (p. ej. “Login”, “Dashboard principal”), para saber qué parte del producto representa.
- Como usuario, quiero poder descargar o exportar los diseños (imagen o PDF) para presentaciones o handoff a desarrollo externo.

### Integración con el flujo IA DLC

- Como usuario, quiero que la generación de diseños esté disponible una vez completado Phase 01 (KIRO), para no bloquear el flujo y tener specs como input.
- Como usuario, quiero que el Frontend Dev pueda consultar los diseños aprobados al implementar (Phase 04), para que el código siga las pantallas acordadas.
- Como usuario, quiero poder aprobar o marcar como “listo para desarrollo” un conjunto de diseños, para cerrar la fase de diseño y pasar a Phase 04 con claridad.

---

## Acceptance Criteria

### Generación

- El usuario puede solicitar “generar wireframes” desde la vista del proyecto (o desde el chat del agente UI/UX Designer) cuando el proyecto tiene al menos un feature con design.md aprobado.
- El sistema genera wireframes por pantalla o flujo definido en design.md (UI flow / pantallas listadas).
- El usuario puede solicitar mockups para un subconjunto de pantallas clave; el sistema genera al menos low-fi (layout + elementos principales).
- El agente UI/UX Designer acepta instrucciones de refinamiento en lenguaje natural (ej. “más espaciado”, “botón más prominente”) y regenera o ajusta el diseño.
- Los diseños generados se guardan en el proyecto y aparecen en la vista de diseños sin necesidad de recargar manualmente.

### Almacenamiento y vista

- Existe una sección “Diseño” o “Design” en el proyecto (sidebar o ruta dedicada) donde se listan wireframes y mockups del proyecto.
- Cada ítem muestra: nombre de pantalla/flujo, tipo (wireframe / mockup), fecha de generación y miniatura o preview.
- Al hacer clic en un diseño se abre una vista de detalle con el HTML renderizado en iframe (controles de dispositivo: mobile 375px, tablet 768px, desktop 1280px).
- Los diseños se almacenan de forma persistente (base de datos + archivos en Storage o equivalente) y sobreviven a recargas y sesiones.

### Hub y navegación

- La vista de diseños presenta al menos dos bloques diferenciados (Camino A y Camino B) con copy orientado a resultado (qué se guarda vs. qué ocurre en el chat).
- Las herramientas del kit muestran orden sugerido y el resultado esperado en lenguaje no técnico.
- El detalle de un artefacto del Camino A enlaza de vuelta al hub para continuar con el Camino B cuando corresponda.

### Integración

- La generación de diseños está desbloqueada solo si el proyecto tiene Phase 01 completada (al menos un spec KIRO con design.md).
- El agente UI/UX Designer tiene acceso al contexto del proyecto: design.md, requirements.md y nombre/industria del proyecto para generar diseños coherentes.
- El usuario puede marcar diseños como “aprobado para desarrollo” (estado opcional pero visible) para Phase 04.
- En Phase 04 (Core Development), el Frontend Dev o la documentación del proyecto pueden referenciar la ruta o lista de diseños aprobados.

### Calidad y límites

- Wireframes son HTML visual renderizable (Tailwind CSS + Google Fonts) con layout, componentes reales e iconos SVG; representan estructura y jerarquía con colores neutros.
- Mockups low-fi incluyen un color primario, componentes con specs detallados (nav, cards, buttons, inputs, tables), iconos SVG y contenido placeholder realista.
- Mockups high-fi son diseños de producto terminado con paleta completa, micro-interacciones, tipografía refinada y aspecto tipo Figma export.
- Si no hay design.md o UI flow definido, el sistema muestra un mensaje claro indicando que debe completar Phase 01 primero.
- Rate limiting o cuota por proyecto para generación (evitar abuso de APIs de generación de imágenes) según constraints del producto.

---

## Non-Functional Requirements

- **Performance:** La lista de diseños del proyecto carga en menos de 2s. La generación de un wireframe/mockup puede ser asíncrona; el usuario recibe feedback de “generando…” y notificación al terminar.
- **Security:** Archivos de diseño almacenados en bucket privado (Supabase Storage o similar); acceso solo para el usuario propietario del proyecto. Inputs al LLM y al generador de imágenes sanitizados (no ejecución de código).
- **Accessibility:** La vista de diseños es navegable por teclado; imágenes con texto alternativo descriptivo (nombre de pantalla/flujo).
- **Coste:** Uso de API de generación de imágenes (si aplica) acotado por proyecto o por plan; no generaciones ilimitadas sin control.

---

## Out of Scope

- Edición pixel-level de diseños dentro de la plataforma (solo generación y refinamiento vía agente).
- Colaboración en tiempo real sobre el mismo diseño (multi-cursor, comentarios inline) — v2.
- Integración con Figma/Sketch (import/export) — v2.
- Generación de prototipos interactivos clickeables — v2.
- Detección automática de componentes reutilizables (design system) a partir de mockups — v2.
- Soporte para diseño móvil vs desktop como flujos separados en v1 (se puede mencionar en el prompt; generación única por pantalla es aceptable).
