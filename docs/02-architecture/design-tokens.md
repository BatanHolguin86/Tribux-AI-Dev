# Design Tokens — AI Squad Command Center (v2)

Tokens definidos en `src/app/globals.css` para unificar colores, tipografia, espaciado y comportamiento visual.

---

## 1. Colores

### Brand & Primary

| Token                 | Light           | Dark            | Tailwind       | Uso                              |
| --------------------- | --------------- | --------------- | -------------- | -------------------------------- |
| `--primary`           | `124 58 237`    | `124 58 237`    | `violet-600`   | CTAs, links, estado activo       |
| `--primary-hover`     | `109 40 217`    | `109 40 217`    | `violet-700`   | Hover en botones primarios       |
| `--primary-foreground`| `#ffffff`       | `#ffffff`       | `white`        | Texto sobre primary              |

### Neutrals

| Token                 | Light           | Dark            | Tailwind Light → Dark         |
| --------------------- | --------------- | --------------- | ----------------------------- |
| `--background`        | `#ffffff`       | `#0a0a0a`       | `bg-white` → `dark:bg-gray-900` |
| `--foreground`        | `#171717`       | `#ededed`       | `text-gray-900` → `dark:text-gray-100` |
| `--muted`             | `245 245 245`   | `38 38 38`      | `bg-gray-50` → `dark:bg-gray-800` |
| `--muted-foreground`  | `115 115 115`   | `163 163 163`   | `text-gray-500` → `dark:text-gray-400` |
| `--border`            | `229 229 229`   | `38 38 38`      | `border-gray-200` → `dark:border-gray-700` |
| `--card`              | `#ffffff`       | `23 23 23`      | `bg-white` → `dark:bg-gray-900` |
| `--card-border`       | `229 229 229`   | `38 38 38`      | `border-gray-200` → `dark:border-gray-700` |
| `--surface`           | `250 250 250`   | `23 23 23`      | `bg-gray-50` → `dark:bg-gray-800` |
| `--surface-elevated`  | `#ffffff`       | `38 38 38`      | `bg-white` → `dark:bg-gray-800` |

### Semantic

| Token       | Value          | Tailwind      | Uso                         |
| ----------- | -------------- | ------------- | --------------------------- |
| `--success` | `34 197 94`    | `green-500`   | Aprobado, completado        |
| `--warning` | `234 179 8`    | `amber-500`   | Pendiente, atencion         |
| `--error`   | `239 68 68`    | `red-500`     | Error, rechazado            |
| `--info`    | `59 130 246`   | `blue-500`    | Informacion, links          |

---

## 2. Tipografia

| Nivel       | Tailwind Classes              | Uso                        |
| ----------- | ----------------------------- | -------------------------- |
| H1          | `text-2xl font-bold`          | Titulos de pagina          |
| H2          | `text-lg font-bold`           | Headers de seccion         |
| H3          | `text-sm font-bold`           | Sub-secciones, modales     |
| Body        | `text-sm leading-relaxed`     | Contenido principal        |
| Chat        | `text-[13px] leading-relaxed` | Mensajes de chat           |
| Small       | `text-xs font-medium`         | Labels, badges, metadata   |
| Micro       | `text-[10px]`                 | Timestamps, avatares       |

**Font:** Inter (variable `--font-inter`)

---

## 3. Espaciado

### Padding / Gaps Estandar

| Contexto         | Token / Value  | Uso                              |
| ---------------- | -------------- | -------------------------------- |
| Inputs/Buttons   | `px-3 py-2`    | Inputs, botones secundarios      |
| Botones CTA      | `px-4 py-2.5`  | Botones primarios                |
| Cards            | `p-5`          | Padding interno de project cards |
| Modales          | `p-6`          | Padding de modal body            |
| Secciones        | `px-4 py-4`    | Areas de chat, content areas     |
| Gaps en grids    | `gap-3`, `gap-4`| Entre cards, entre panels        |
| Gaps entre items | `space-y-4`    | Mensajes de chat, form fields    |

### Dimensiones

| Token              | Value    | Uso                          |
| ------------------ | -------- | ---------------------------- |
| `--sidebar-width`  | `16rem`  | Sidebar de agentes/features  |
| `--header-height`  | `3.5rem` | Top navigation bar           |
| `--content-height` | `calc(100vh - 11rem)` | Split-view panel height |

---

## 4. Border Radius

| Token          | Value     | Tailwind      | Uso                          |
| -------------- | --------- | ------------- | ---------------------------- |
| `--radius-sm`  | `0.375rem`| `rounded-md`  | Badges, status dots          |
| `--radius-md`  | `0.5rem`  | `rounded-lg`  | Inputs, botones              |
| `--radius-lg`  | `0.75rem` | `rounded-xl`  | Cards, modales, panels       |
| `--radius-xl`  | `1rem`    | `rounded-2xl` | Chat bubbles                 |
| Full           | `9999px`  | `rounded-full`| Avatares, pills              |

---

## 5. Elevacion (Shadows)

| Nivel     | Tailwind       | Dark Variant                 | Uso                    |
| --------- | -------------- | ---------------------------- | ---------------------- |
| Flat      | (ninguno)      | —                            | Contenido inline       |
| Subtle    | `shadow-sm`    | `dark:shadow-gray-900/20`    | Cards, panels          |
| Medium    | `shadow-md`    | `dark:shadow-gray-900/30`    | Hover de cards         |
| Elevated  | `shadow-xl`    | `dark:shadow-black/30`       | Modales, dropdowns     |

---

## 6. Avatares

| Size   | Classes                | Uso                        |
| ------ | ---------------------- | -------------------------- |
| sm     | `h-7 w-7 text-[10px]` | Chat messages, streaming   |
| md     | `h-8 w-8 text-xs`     | Agent headers (obsoleto — migrar a sm) |
| lg     | `h-10 w-10 text-sm`   | Agent cards, empty states  |

**Estandar:** `h-7 w-7` para todos los chat avatars (user y AI).

---

## 7. Progress Bars

| Componente     | Height   | Track              | Fill              |
| -------------- | -------- | ------------------- | ----------------- |
| Phase 00       | `h-1.5`  | `bg-gray-200`       | `bg-emerald-500` (approved), `bg-violet-400` (active) |
| Phase 01-02    | `h-1.5`  | `bg-gray-200`       | `bg-violet-600`   |
| Phase 03-07    | `h-1.5`  | `bg-gray-200`       | `bg-violet-600`   |

---

## 8. Dark Mode

**Estrategia:** `prefers-color-scheme: dark` via CSS variables + Tailwind `dark:` variants.

**Convenciones de mapeo:**

```
Light                    → Dark
bg-white                 → dark:bg-gray-900
bg-gray-50               → dark:bg-gray-800
bg-gray-100              → dark:bg-gray-800
bg-gray-200              → dark:bg-gray-700
border-gray-200          → dark:border-gray-700
border-gray-100          → dark:border-gray-800
border-gray-300          → dark:border-gray-600
text-gray-900            → dark:text-gray-100
text-gray-800            → dark:text-gray-200
text-gray-700            → dark:text-gray-300
text-gray-600            → dark:text-gray-400
text-gray-500            → dark:text-gray-400
text-gray-400            → dark:text-gray-500
bg-violet-50             → dark:bg-violet-900/20
bg-violet-100            → dark:bg-violet-900/30
bg-emerald-50            → dark:bg-emerald-900/20
bg-emerald-100           → dark:bg-emerald-900/30
shadow-sm                → dark:shadow-gray-900/20
shadow-xl                → dark:shadow-black/30
```

---

## 9. Consistencia por Zona

| Zona           | Layout                          | Tokens clave                     |
| -------------- | ------------------------------- | -------------------------------- |
| Auth           | Split (brand left, form right)  | violet-600 CTA, gray text        |
| Dashboard      | Grid de project cards           | shadow-sm cards, violet badges   |
| Phases 00-02   | Split (chat left, doc right)    | h-7 avatars, rounded-xl bubbles  |
| Phases 03-07   | PhaseProgressHeader + content   | h-1.5 progress, violet fill      |
| Agents         | Sidebar + chat + thread list    | h-7 avatars, violet-100 AI bg    |
| Settings       | Stacked sections                | gray borders, violet CTAs        |
| Modals         | Centered overlay, max-w-md/lg   | rounded-xl, shadow-xl, p-6       |

---

## 10. Accesibilidad

- Todos los icon buttons tienen `aria-label`
- Modales tienen `role="dialog"` + `aria-modal="true"` + focus trap
- Chat containers tienen `role="log"` + `aria-live="polite"`
- Focus states: `focus:border-violet-500 focus:ring-1 focus:ring-violet-500`
- Color no es el unico diferenciador (iconos + color para estados)
