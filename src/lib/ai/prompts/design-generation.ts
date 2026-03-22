import type { DesignType } from '@/types/design'

type DesignGenerationContext = {
  projectName: string
  screens: string[]
  type: DesignType
  featureSpecs: string
  discoveryDocs: string
  refinement?: string
}

const TYPE_INSTRUCTIONS: Record<DesignType, string> = {
  wireframe: `ESTILO VISUAL: Wireframe
- Colores neutros: bg-gray-50, bg-gray-100, bg-white, bordes gray-200/300
- Bordes punteados (border-dashed) para placeholders de imagenes
- Sin sombras pesadas, sin gradientes
- Texto en gray-600/700/900
- Enfocate en ESTRUCTURA y LAYOUT`,
  mockup_lowfi: `ESTILO VISUAL: Mockup Low-Fidelity — DISENO VISUAL COMPLETO

COLOR SYSTEM:
- Color primario: sky-500/sky-600 para CTAs, links activos, iconos destacados
- Escala de grays: gray-50 (fondo), gray-100 (cards), gray-200 (bordes), gray-400 (texto secundario), gray-700 (texto principal), gray-900 (headings)
- Semantic colors: emerald-500 (success), amber-500 (warning), red-500 (error)

COMPONENTES REQUERIDOS — disena CADA uno visualmente:
- Navigation bar: logo placeholder (cuadrado rounded-lg bg-sky-500 con iniciales), links con hover states, avatar de usuario
- Cards: bg-white rounded-xl shadow-sm border border-gray-200, padding p-4/p-6, con header + body + footer
- Botones: primario (bg-sky-500 text-white rounded-lg px-4 py-2.5), secundario (border border-gray-300 text-gray-700), ghost (text-sky-600 hover:bg-sky-50)
- Inputs: border border-gray-300 rounded-lg px-3 py-2.5, con label arriba y helper text abajo
- Tablas: headers bg-gray-50, filas con hover:bg-gray-50, bordes sutiles
- Badges/Tags: rounded-full px-2.5 py-1 text-xs font-medium con color de fondo semantico
- Empty states: icono SVG centrado + texto descriptivo + CTA

LAYOUT Y ESPACIADO:
- Spacing system: 4px base (p-1=4px, p-2=8px, p-4=16px, p-6=24px, p-8=32px)
- Contenedores: max-w-sm para mobile, centrado con mx-auto
- Gaps consistentes: gap-3 entre elementos, gap-6 entre secciones
- Separadores: border-b border-gray-100 entre items de lista

ICONOS SVG INLINE (incluir al menos 8 distintos):
- Flecha atras, user/avatar, search/lupa, settings/engranaje, check/checkmark, plus/agregar, chevron-right, bell/notificacion, edit/lapiz, trash/eliminar

CONTENIDO PLACEHOLDER REALISTA:
- Nombres: "Maria Garcia", "Carlos Lopez", "Ana Martinez"
- Emails: "maria@empresa.com", "carlos@startup.io"
- Montos: "$2,450.00", "$890.50"
- Fechas: "15 Mar 2026", "Hace 2 horas"
- Textos descriptivos cortos y relevantes al contexto de la pantalla

ESTADOS (incluir variantes visibles):
- Default: estado normal del componente
- Hover: indicar con comentarios HTML donde aplican hover states
- Loading: al menos un skeleton placeholder (animate-pulse bg-gray-200 rounded)
- Empty: un empty state con icono + texto + CTA`,

  mockup_highfi: `ESTILO VISUAL: Mockup High-Fidelity — PRODUCTO TERMINADO Y PROFESIONAL

PALETA DE COLORES COMPLETA:
- Primary: violet-600 (#7c3aed) como color principal, violet-700 hover, violet-50 backgrounds sutiles
- Secondary: slate-600 para texto, slate-900 para headings
- Accent: amber-500 para highlights, notificaciones, badges premium
- Success: emerald-500/emerald-50, Warning: amber-500/amber-50, Error: rose-500/rose-50, Info: sky-500/sky-50
- Fondos: gradient sutil de gray-50 a white, o bg-gradient-to-br from-violet-50 via-white to-sky-50
- Dark surfaces: slate-900 para headers premium, white para content areas

TIPOGRAFIA REFINADA (Google Fonts Inter):
- Headings: font-bold tracking-tight (text-2xl para h1, text-xl para h2, text-lg para h3)
- Body: font-normal text-sm text-slate-600 leading-relaxed
- Labels: font-medium text-xs text-slate-500 uppercase tracking-wider
- Numeros/montos: font-semibold tabular-nums

COMPONENTES PREMIUM — cada uno con DETALLE VISUAL MAXIMO:
- Navigation: bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0, con logo SVG, links con indicador activo (border-b-2 border-violet-600), dropdown de usuario con avatar + nombre + rol
- Cards: bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100, con hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200
- Botones: primario (bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-2.5 shadow-sm shadow-violet-200 font-medium transition-all), secundario, ghost, destructive (bg-rose-500)
- Inputs: bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all, con label flotante o arriba
- Data tables: rounded-xl overflow-hidden, header bg-slate-50 font-medium text-xs uppercase, filas con hover:bg-violet-50/30, pagination elegante
- Modales: backdrop-blur-sm bg-black/20, content bg-white rounded-2xl shadow-2xl p-6 con animacion
- Progress bars: bg-violet-100 rounded-full overflow-hidden, barra bg-gradient-to-r from-violet-500 to-violet-600
- Avatares: rounded-full con ring-2 ring-white shadow-sm, grupo de avatares con -space-x-2
- Toasts/Alerts: rounded-xl border-l-4 p-4 con icono SVG + titulo bold + descripcion
- Tabs: bg-slate-100 rounded-xl p-1, tab activo bg-white rounded-lg shadow-sm font-medium

MICRO-INTERACCIONES (indicar con clases Tailwind):
- transition-all duration-200 en botones y cards
- hover:-translate-y-0.5 en cards
- hover:shadow-xl para elevacion
- focus:ring-2 focus:ring-violet-500/20 en inputs

LAYOUT PROFESIONAL:
- Spacing generoso: p-6/p-8, gap-6 entre secciones
- max-w-sm para mobile, centrado con mx-auto
- Seccion hero con gradiente sutil de fondo
- Separadores con opacity: divide-y divide-slate-100
- Grid de stats/metricas: 2-3 columnas con numeros grandes + labels pequenos + iconos de tendencia

ICONOS SVG DETALLADOS (minimo 12 distintos):
- Incluir iconos para: navigation, acciones CRUD, estados, categorias, metricas
- Estilo: stroke-width=1.5, rounded line caps, 24x24 viewBox
- Color: currentColor para heredar del contexto

CONTENIDO ULTRA-REALISTA:
- Nombres completos: "Maria Garcia Lopez", "Carlos Mendez R."
- Datos de negocio: "$12,450.00 MXN", "32 proyectos activos", "+12.5% vs mes anterior"
- Fechas formateadas: "15 de marzo, 2026", "Hace 3 min"
- Descripciones contextuales relevantes al proyecto
- Imagenes placeholder: divs con bg-gradient-to-br from-violet-400 to-sky-400 + icono centrado

ESTADOS COMPLETOS:
- Default, Hover, Active, Focus, Disabled (opacity-50 cursor-not-allowed)
- Loading: skeleton con animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200
- Empty state: ilustracion SVG inline + heading + texto descriptivo + CTA primario
- Success state: bg-emerald-50 border-emerald-200 con icono check animado

DEBE VERSE COMO UN PRODUCTO REAL LISTO PARA PRODUCCION — tipo Figma export.`,
}

const HTML_DESIGN_PROMPT = `ROL: Eres un disenador UI/UX experto. Tu tarea es generar disenos VISUALES como HTML renderizable.

REGLA ABSOLUTA: Tu respuesta debe ser UNICAMENTE codigo HTML valido.
- NUNCA uses markdown
- NUNCA uses ASCII art
- NUNCA uses bloques de codigo (\`\`\`)
- NUNCA escribas explicaciones fuera del HTML
- La primera linea de tu respuesta DEBE ser: <!DOCTYPE html>
- La ultima linea DEBE ser: </html>

STACK VISUAL: HTML5 + Tailwind CSS (via CDN) + Google Fonts (Inter).
ENFOQUE: Mobile-first, accesible, profesional.`

export function buildDesignGenerationPrompt(ctx: DesignGenerationContext): string {
  const screensList = ctx.screens.map((s, i) => `${i + 1}. ${s}`).join('\n')

  return `${HTML_DESIGN_PROMPT}

---

PROYECTO: "${ctx.projectName}"

PANTALLAS A DISENAR:
${screensList}

${TYPE_INSTRUCTIONS[ctx.type]}

${ctx.refinement ? `INSTRUCCIONES ADICIONALES DEL USUARIO:\n${ctx.refinement}\n` : ''}
${ctx.discoveryDocs ? `CONTEXTO DEL PROYECTO:\n${ctx.discoveryDocs.slice(0, 4000)}\n` : ''}
${ctx.featureSpecs ? `SPECS DE FEATURES:\n${ctx.featureSpecs.slice(0, 4000)}\n` : ''}

GENERA el HTML con esta estructura exacta:

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>* { font-family: 'Inter', sans-serif; }</style>
  <title>${ctx.projectName} — Disenos</title>
</head>
<body class="bg-gray-50">
  <!-- Para CADA pantalla, una <section> con:
       - Header con nombre de la pantalla
       - El diseno visual completo con componentes reales
       - Contenido placeholder REALISTA
       - Todos los estados relevantes (default, error, success, empty)
  -->
</body>
</html>

IMPORTANTE:
- Usa contenido REALISTA (no "Lorem ipsum"): nombres como "Maria Garcia", emails como "maria@email.com"
- Cada pantalla en una <section class="max-w-sm mx-auto mb-12 bg-white rounded-2xl shadow-lg overflow-hidden">
- Incluye navegacion, formularios, botones, cards — elementos REALES de UI
- Los iconos deben ser SVG inline simples (flechas, check, user, etc.)
- Disena para mobile (375px) como layout principal`
}

type DesignRefineContext = {
  projectName: string
  existingContent: string
  instruction: string
}

export function buildDesignRefinePrompt(ctx: DesignRefineContext): string {
  return `${HTML_DESIGN_PROMPT}

---

TAREA: Refina el diseno HTML del proyecto "${ctx.projectName}".

DISENO HTML ACTUAL:
${ctx.existingContent}

CAMBIOS PEDIDOS POR EL USUARIO:
${ctx.instruction}

Genera el HTML COMPLETO actualizado con los cambios aplicados.
Tu respuesta debe empezar con <!DOCTYPE html> y terminar con </html>.
No incluyas explicaciones — solo el HTML.`
}
