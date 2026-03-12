# Design Tokens — AI Squad

Tokens definidos en `src/app/globals.css` para unificar colores y formatos.

## Colores


| Token                | Uso                                     | Tailwind equivalente |
| -------------------- | --------------------------------------- | -------------------- |
| `--primary`          | Botones primarios, links, estado activo | `violet-600`         |
| `--muted`            | Fondos secundarios, disabled            | `gray-100`           |
| `--muted-foreground` | Texto secundario, labels                | `gray-500`           |
| `--border`           | Bordes de cards, inputs                 | `gray-200`           |
| `--success`          | Aprobado, éxito                         | `green-500`          |
| `--warning`          | Pendiente, atención                     | `yellow-500`         |
| `--error`            | Error, rechazado                        | `red-500`            |


## Radios y espaciado

- `--radius-sm`: 6px — badges, pills
- `--radius-md`: 8px — inputs, botones
- `--radius-lg`: 12px — cards, modales
- `--sidebar-width`: 16rem — sidebar de fases/features/agentes
- `--header-height`: 3.5rem — top bar

## Uso en componentes

- Preferir clases Tailwind que coincidan con los tokens: `bg-violet-600`, `text-gray-500`, `rounded-lg`.
- Para temas o overrides, usar las variables CSS: `background: rgb(var(--primary))`.
- Dark mode: las variables se sobrescriben en `@media (prefers-color-scheme: dark)`.

## Consistencia por zona

- **Fases (00–07)**: mismo layout (sidebar + contenido), mismos radios y espaciado.
- **Fases 03–07**: cabecera de progreso unificada en `PhaseProgressHeader` (título, contador, barra, objetivo opcional); barra con `bg-violet-600` (primary) y `bg-gray-200` (track).
- **Chat**: burbujas usuario (primary), asistente (muted).
- **Badges de estado**: pending (muted), in_progress (primary), approved (success).

