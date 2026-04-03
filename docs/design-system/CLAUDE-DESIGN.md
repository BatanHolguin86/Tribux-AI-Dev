# AI Squad Command Center — Instrucciones de Design System

## Contexto
Este proyecto es una plataforma SaaS B2B llamada AI Squad Command Center. Permite a estrategas no-tecnicos construir productos tecnologicos end-to-end usando un equipo de agentes IA especializados, siguiendo la metodologia IA DLC de 8 fases.

## Design System Obligatorio
ANTES de crear o modificar cualquier componente visual, LEE el archivo `docs/design-system/DESIGN-SYSTEM.md` para conocer:
- Paleta de colores completa (primarios, semanticos, por fase, por agente)
- Sistema tipografico (DM Sans para titulos, Inter para cuerpo, JetBrains Mono para codigo)
- Patrones de componentes (botones, badges, cards, chat bubbles, sidebar)
- Reglas de estilo que DEBES seguir

## Archivos de Tokens
- `tailwind.config.ts` — Configuracion completa de Tailwind con todos los tokens de color, tipografia, sombras, gradientes y animaciones
- `src/app/globals.css` — Variables CSS (HSL para shadcn/ui), imports de fuentes, utilidades custom

## Reglas Criticas
1. Titulos: SIEMPRE `font-display` (DM Sans), NUNCA Inter
2. Color primario: `#0F2B46` (Command Blue), NO azules genericos
3. Teal `#0EA5A3` para acciones secundarias y focus rings
4. Amber `#F59E0B` para gates de validacion y CTAs de upgrade
5. Sidebar con gradiente `#0A1F33 → #0F2B46`, NUNCA fondo plano
6. NO gradientes purpura, NO layouts 100% centrados, NO "AI slop"
7. Border radius: `rounded-lg` (10px) cards/botones, `rounded-xl` (16px) containers
8. Cada agente tiene color asignado — ver DESIGN-SYSTEM.md seccion "Colores por Agente"
9. Cada fase tiene color asignado — ver DESIGN-SYSTEM.md seccion "Colores por Fase IA DLC"
10. Usar Lucide React como libreria de iconos

## Stack Visual
- Next.js 14+ (App Router)
- Tailwind CSS con tokens custom
- shadcn/ui como component library base
- DM Sans + Inter + JetBrains Mono (Google Fonts)
- Lucide React para iconos
