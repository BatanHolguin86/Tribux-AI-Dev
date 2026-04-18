# Tribux AI — Design System

Este documento es la referencia autoritativa de identidad visual, tokens de diseno y patrones de UI para el producto. Cualquier agente de IA (Claude Code, Cursor, etc.) DEBE seguir estas reglas al generar o modificar componentes visuales.

---

## Paleta de Colores

### Primarios
| Token               | Hex       | Uso                                    |
| ------------------- | --------- | -------------------------------------- |
| `command-blue`      | `#0F2B46` | Color primario, botones, headers, texto |
| `squad-teal`        | `#0EA5A3` | Acciones secundarias, links, focus      |
| `signal-amber`      | `#F59E0B` | CTAs de upgrade, gates, alertas amber   |
| `deep-navy`         | `#0A1F33` | Sidebar, fondos oscuros profundos       |

### Semanticos
| Token     | Hex       | Uso                           |
| --------- | --------- | ----------------------------- |
| `success` | `#10B981` | Fases completadas, validacion |
| `warning` | `#F97316` | Gates pendientes, alertas     |
| `error`   | `#EF4444` | Errores, bloqueos             |
| `info`    | `#3B82F6` | Informacion, en progreso      |
| `muted`   | `#94A3B8` | Texto secundario, placeholders|

### Superficies
| Token     | Hex       | Uso                   |
| --------- | --------- | --------------------- |
| `canvas`  | `#F8FAFC` | Fondo de la app       |
| `surface` | `#F1F5F9` | Cards muted, fondos   |
| `card`    | `#FFFFFF` | Cards, popovers       |
| `border`  | `#E2E8F0` | Bordes, separadores   |

### Gradientes
- **Hero:** `linear-gradient(135deg, #0F2B46 0%, #0EA5A3 100%)` — Hero sections, CTAs
- **Phase Progress:** `linear-gradient(90deg, #0EA5A3 0%, #10B981 100%)` — Barras de progreso
- **Sidebar:** `linear-gradient(180deg, #0A1F33 0%, #0F2B46 100%)` — Sidebar background

### Colores por Fase IA DLC
| Fase | Color     | Token Tailwind        |
| ---- | --------- | --------------------- |
| 00   | `#6366F1` | `phase-discovery`     |
| 01   | `#8B5CF6` | `phase-requirements`  |
| 02   | `#0EA5A3` | `phase-architecture`  |
| 03   | `#0EA5A3` | `phase-environment`   |
| 04   | `#10B981` | `phase-development`   |
| 05   | `#F59E0B` | `phase-testing`       |
| 06   | `#F97316` | `phase-launch`        |
| 07   | `#EF4444` | `phase-iteration`     |

### Colores por Agente
| Agente            | Color     | Token Tailwind   |
| ----------------- | --------- | ---------------- |
| CTO Virtual       | `#0EA5A3` | `agent-cto`      |
| Product Architect | `#6366F1` | `agent-product`  |
| System Architect  | `#8B5CF6` | `agent-system`   |
| UI/UX Designer    | `#EC4899` | `agent-designer` |
| Lead Developer    | `#0EA5A3` | `agent-developer`|
| DB Admin          | `#F59E0B` | `agent-database` |
| QA Engineer       | `#10B981` | `agent-qa`       |
| DevOps            | `#F97316` | `agent-devops`   |

---

## Tipografia

| Rol       | Familia         | Peso | Tamano/Line-height | Tailwind class      |
| --------- | --------------- | ---- | ------------------ | ------------------- |
| Display   | DM Sans         | 700  | 48px/56px          | `text-display font-display` |
| H1        | DM Sans         | 700  | 36px/44px          | `text-h1 font-display`      |
| H2        | DM Sans         | 600  | 24px/32px          | `text-h2 font-display`      |
| H3        | DM Sans         | 600  | 20px/28px          | `text-h3 font-display`      |
| Body      | Inter           | 400  | 16px/24px          | `text-body font-sans`       |
| Body sm   | Inter           | 400  | 14px/20px          | `text-body-sm font-sans`    |
| Caption   | Inter           | 500  | 12px/16px          | `text-caption font-sans`    |
| Code      | JetBrains Mono  | 400  | 14px/20px          | `text-code font-mono`       |

**Regla:** Titulos y headers SIEMPRE en `font-display` (DM Sans). Cuerpo de texto SIEMPRE en `font-sans` (Inter). Codigo, specs y datos tecnicos en `font-mono`.

---

## Componentes Clave

### Botones
- **Primary:** `bg-brand-command-blue text-white` — Acciones principales (Aprobar fase, Crear proyecto)
- **Secondary:** `bg-brand-squad-teal text-white` — Acciones secundarias (Nuevo proyecto, Abrir chat)
- **Outline:** `border border-border text-foreground bg-transparent` — Acciones terciarias
- **Accent:** `bg-brand-signal-amber text-white` — CTAs de upgrade, acciones urgentes
- **Border radius:** `rounded-lg` (10px) en todos los botones

### Status Badges
```
Completada:         bg-success-light text-success-dark + dot success
En progreso:        bg-info-light text-info-dark + dot info
Pendiente gate:     bg-warning-light text-warning-dark + dot warning
Bloqueada:          bg-error-light text-error-dark + dot error
```

### Phase Card
- Container: `bg-card border border-border rounded-xl p-5`
- Phase number: cuadrado `w-10 h-10 rounded-lg` con color de la fase, texto blanco bold mono
- Progress bar: `h-1.5 rounded-full bg-gradient-phase`
- Gate badge: clases `.gate-pending`, `.gate-approved`, `.gate-blocked`

### Chat Bubbles
- Agente: `.chat-bubble-agent` — fondo blanco, bordes redondeados excepto top-left
- Usuario: `.chat-bubble-user` — fondo command-blue, texto blanco, bordes redondeados excepto top-right
- Sugerencias: `.suggestion-chip` — pill con borde teal, texto teal, hover sutil

### Sidebar
- Fondo: `bg-gradient-sidebar` o `.sidebar-gradient`
- Logo + nombre en la parte superior
- Nav items: `text-body-sm`, activo con `bg-brand-squad-teal/15 text-brand-squad-teal font-semibold`
- Plan badge en la parte inferior: fondo amber transparente

---

## Reglas de Estilo para Agentes de IA

1. **NO usar gradientes purpura** — el producto NO es generico de IA
2. **NO centrar todo** — usar layouts asimetricos con sidebar + content area
3. **NO usar Inter para titulos** — SIEMPRE DM Sans (`font-display`)
4. **Border radius consistente:** `rounded-lg` (10px) para cards y botones, `rounded-xl` (16px) para containers grandes, `rounded-full` para badges/pills
5. **Sombras sutiles:** usar `shadow-card` por defecto, `shadow-elevated` para modales y popovers
6. **Espaciado:** seguir escala de 4px de Tailwind, gap minimo entre cards `gap-3` (12px)
7. **Iconos:** usar Lucide React como libreria de iconos principal
8. **Emojis en agentes:** cada agente tiene su emoji asignado, usarlo como avatar
