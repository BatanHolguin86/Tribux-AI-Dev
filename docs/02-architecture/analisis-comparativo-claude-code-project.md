# Análisis comparativo: AI Squad vs metodología "Claude Code Project"

**Objetivo:** Comparar la estructura actual del repositorio AI Squad con la metodología de la imagen "Claude Code Project" (modular repository con CLAUDE.md, skills, hooks, docs, tools) y señalar coincidencias, diferencias y mejoras sugeridas.

---

## 1. Estructura de la metodología de la imagen

| Elemento               | Función en la metodología                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **`CLAUDE.md`** (raíz) | Memoria e instrucciones globales para Claude.                                                                                                |
| **`README.md`**        | Documentación estándar del proyecto.                                                                                                         |
| **`docs/`**            | `architecture.md`, `decisions/`, `runbooks/` — decisiones y documentación.                                                                   |
| **`.claude/`**         | Configuración y flujos de IA: `settings.json`, `hooks/`, `skills/` (code-review, refactor, release, cada uno con `SKILL.md`).                |
| **`tools/`**           | `scripts/`, `prompts/` — utilidades y prompts reutilizables.                                                                                 |
| **`src/`**             | Módulos de aplicación; **por módulo** puede haber un `CLAUDE.md` (ej. `src/api/CLAUDE.md`, `src/persistence/CLAUDE.md`) para contexto local. |

**Principios de la metodología:**  
Contexto de IA enfocado y estructurado; skills para flujos reutilizables; hooks para guardas y automatización; documentar decisiones; diseño modular; mantener el contexto de IA mínimo y preciso.

---

## 2. Estructura actual de AI Squad (resumida)

| Elemento               | En AI Squad                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`CLAUDE.md`** (raíz) | ✅ Existe y es muy completo: rol de CTO Virtual, metodología IA DLC (8 fases), stack, formato KIRO, estructura de carpetas, convenciones, agentes, checklist de lanzamiento.                                                                                                                                                                        |
| **`README.md`**        | ✅ Presente en raíz (y en `docs/README.md`).                                                                                                                                                                                                                                                                                                        |
| **`docs/`**            | ✅ Muy desarrollado: `00-discovery/`, `01-specs/` (PRD, features con requirements/design/tasks), `02-architecture/` (system-architecture, database-schema, design-tokens, **decisions/** con ADRs), `05-qa/`, `06-ops/`. **No** hay una carpeta `docs/runbooks/` explícita; el contenido de runbooks está en `06-ops/` (migraciones, Sentry, etc.). |
| **`.claude/`**         | ❌ No existe. El proyecto usa **Cursor**; hay `.cursor/rules/` (p. ej. `ui-ux-design-generator-scope.mdc`) para reglas por contexto, no una carpeta `.claude` con skills/hooks.                                                                                                                                                                     |
| **Skills / Hooks**     | ❌ No hay carpeta `.claude/skills/` ni `.claude/hooks/`. Las "skills" y flujos reutilizables están implícitos en el contenido de `CLAUDE.md` y en reglas de Cursor, no en SKILL.md por flujo.                                                                                                                                                       |
| **`tools/`**           | ❌ No hay carpeta `tools/`. Los **scripts** están en `scripts/` (p. ej. `test-anthropic.ts`, `apply-migration-013.ts`) e `infrastructure/scripts/`. Los **prompts** están en `src/lib/ai/prompts/` (phase-00, phase-01, feature-suggestions, etc.), no en `tools/prompts/`.                                                                         |
| **`src/`**             | ✅ Estructura Next.js: `app/`, `components/`, `lib/`, `hooks/`, `stores/`, `types/`. **No** hay `CLAUDE.md` por submódulo (no existe `src/api/CLAUDE.md` ni `src/persistence/CLAUDE.md`); la API vive en `app/api/` y la persistencia en `lib/supabase/` y migraciones.                                                                             |

---

## 3. Comparación lado a lado

| Aspecto                              | Metodología imagen                                                        | AI Squad                                                           | Valoración                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Memoria / instrucciones globales** | `CLAUDE.md` enfocado y estructurado                                       | `CLAUDE.md` muy completo (IA DLC, KIRO, stack, convenciones)       | ✅ Cubierto; AI Squad es más rico en proceso de producto.                                                                                      |
| **Documentación de arquitectura**    | `docs/architecture.md`, `docs/decisions/`                                 | `docs/02-architecture/` con varios .md y `decisions/` (ADRs)       | ✅ Equivalente o superior; decisiones bien documentadas.                                                                                       |
| **Runbooks**                         | `docs/runbooks/`                                                          | Contenido en `docs/06-ops/` (migraciones, Sentry, etc.)            | ⚠️ Mismo propósito, distinto nombre; se podría crear `docs/runbooks/` y enlazar o mover desde 06-ops.                                          |
| **Skills (flujos IA reutilizables)** | `.claude/skills/` con SKILL.md por flujo (code-review, refactor, release) | No existe; el rol y flujos están en `CLAUDE.md` y en reglas Cursor | ⚠️ Diferencia: no hay skills explícitas; podrían añadirse skills tipo "code-review", "release" si se usa Claude en el repo.                    |
| **Hooks (guardas / automatización)** | `.claude/hooks/`                                                          | No existe como tal; Husky + lint-staged cubren pre-commit          | ⚠️ Hooks de "Claude" no aplican igual en Cursor; la idea de guardas está parcialmente en CI/linters.                                           |
| **Scripts y prompts**                | `tools/scripts/`, `tools/prompts/`                                        | `scripts/`, `src/lib/ai/prompts/`                                  | ✅ Funcionalmente equivalente; la separación en `tools/` sería sobre todo organizativa.                                                        |
| **Contexto por módulo**              | `src/api/CLAUDE.md`, `src/persistence/CLAUDE.md`                          | No hay CLAUDE.md por carpeta en src                                | ⚠️ Podría ayudar a tener instrucciones específicas para `src/app/api/`, `src/lib/supabase/`, etc., si se quiere contexto más local para la IA. |
| **Modularidad del código**           | Diseño modular (api, persistence)                                         | Next.js App Router + lib (supabase, ai, validations, storage)      | ✅ Buena modularidad; la nomenclatura es distinta (app vs api puro).                                                                           |

---

## 4. Conclusiones

- **Lo que ya está alineado:**
  - Un solo `CLAUDE.md` potente como memoria e instrucciones.
  - Documentación de arquitectura y decisiones (ADRs) clara.
  - Runbooks operativos (en 06-ops).
  - Scripts y prompts presentes, aunque en rutas distintas a `tools/`.
  - Repositorio modular (app, lib, components, infrastructure, tests).

- **Diferencias principales:**
  - **Ecosistema:** La imagen asume flujos de **Claude** (`.claude/`, skills, hooks); AI Squad usa **Cursor** y un único CLAUDE.md muy detallado, sin carpeta de skills ni hooks de Claude.
  - **Skills:** No hay "skills" explícitas en formato SKILL.md; el equivalente son las reglas en `.cursor/rules/` y las instrucciones dentro de `CLAUDE.md`.
  - **Contexto por módulo:** No hay CLAUDE.md por submódulo en `src/`; todo el contexto está en raíz.

- **Recomendaciones opcionales (sin cambiar el flujo actual):**
  1. **Runbooks:** Crear `docs/runbooks/` y mover o enlazar desde `06-ops/` los runbooks existentes, para acercarse al esquema de la imagen.
  2. **Skills (si se quiere formalizar):** En Cursor se pueden definir "skills" en `.cursor/skills/` o reglas tipo SKILL en `.cursor/rules/` para flujos repetibles (p. ej. "code-review", "release", "kiro-spec").
  3. **Contexto por módulo:** Añadir, si se desea, `src/app/api/CLAUDE.md` o `src/lib/supabase/CLAUDE.md` con instrucciones cortas para ese ámbito (APIs, persistencia), manteniendo el CLAUDE.md global como fuente principal.
  4. **Herramientas:** Opcionalmente crear `tools/` y colocar dentro `scripts/` y `prompts/` (o enlaces) para que la estructura coincida más con la imagen, sin obligar a mover todo el código de prompts fuera de `src/lib/ai/`.

En conjunto, AI Squad **cumple el espíritu** de la metodología (memoria clara, documentación, modularidad, scripts y prompts organizados) con una **estructura adaptada** a Next.js, Cursor y al proceso IA DLC/KIRO; las diferencias son sobre todo de nombres, ubicación de runbooks y ausencia de skills/hooks al estilo Claude.
