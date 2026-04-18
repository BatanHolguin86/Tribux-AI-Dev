# ADR-007: Hub «Diseño & UX» — dos caminos (visual vs. agente)

**Estado:** Aceptado  
**Fecha:** 2026-03-08  
**Contexto:** Phase 02 — diseño UI/UX en Tribux AI

## Contexto

Los usuarios confundían la vista de diseños: mezclaban **generación de pantallas guardadas** con **herramientas de sistema de diseño** que solo abrían un chat sin flujo claro. La propuesta de valor del producto enfatiza metodología (IA DLC), alineación negocio–técnica y entregables verificables.

## Decisión

1. **Naming en producto:** la ruta `/projects/[id]/designs` se presenta como **Diseño & UX** (no solo «Design Generator»).
2. **Dos caminos explícitos en UI:**
   - **Camino A — Pantallas visuales:** formulario → `POST /api/projects/[id]/designs/generate` → artefactos en `design_artifacts` → lista y detalle con aprobar/refinar.
   - **Camino B — Kit de diseño con agente:** seis herramientas (más custom) en **orden sugerido**; cada una crea un hilo con el UI/UX Designer y envía un primer mensaje enriquecido con contexto Discovery (`getDesignWorkflowContext`) y guion CTO+UX (`design-tool-workflow.ts`).
3. **Breadcrumb contextual:** `ProjectBreadcrumb` distingue fase actual vs. Diseño & UX vs. detalle de artefacto vs. Agentes IA, evitando mostrar «Phase XX» cuando la vista no es la fase.
4. **Vista de chat activa:** la guía larga (alineación CTO, pasos, Discovery) va en `<details>` **cerrado por defecto**; se prioriza el área de conversación y un callout «Qué hacer ahora».

## Formato de salida (actualizado marzo 2026)

- **Camino A:** El LLM genera HTML autocontenido con Tailwind CSS (via CDN) + Google Fonts (Inter). Tres niveles: wireframe (neutro), mockup low-fi (un color primario + componentes detallados), mockup high-fi (paleta completa, micro-interacciones, aspecto Figma). Se renderiza en iframe con sandbox y controles de dispositivo (375px/768px/1280px).
- **Camino B:** El agente UI/UX Designer genera bloques HTML con Tailwind en la conversación (nunca ASCII art). Entregables: wireframes visuales, style guide con muestras de color, component library con ejemplos renderizables, user flows con diagramas, responsive specs con layouts por breakpoint.

## Consecuencias

- **Positivas:** claridad funcional, alineación con value proposition (metodología + personas + value prop), menos abandono en el hub. Diseños visuales tipo Figma en lugar de ASCII art.
- **Negativas:** más superficie de UI que mantener; copy debe mantenerse sincronizado con `design-tool-workflow.ts` y specs en `docs/01-specs/06-ui-ux-design-generator/`.

## Referencias

- Código: `src/components/design/DesignGenerator.tsx`, `src/lib/design/design-tool-workflow.ts`, `src/components/projects/ProjectBreadcrumb.tsx`
- Spec: `docs/01-specs/06-ui-ux-design-generator/design.md` (sección Hub)
