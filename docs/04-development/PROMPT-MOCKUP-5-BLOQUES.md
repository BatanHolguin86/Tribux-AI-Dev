# Prompt para Claude Code — Implementar Mockup Dashboard (5 Bloques)

> **Instrucción:** Copia TODO este prompt y pégalo en Claude Code (terminal) o en Cursor como instrucción. El agente ejecutará los 5 bloques secuencialmente.

---

## CONTEXTO

Soy el CTO Virtual del proyecto AI Squad Command Center. El design system está definido en `docs/design-system/DESIGN-SYSTEM.md` y los tokens CSS están en `src/app/globals.css` (Tailwind v4 con `@theme inline`).

El dashboard actual tiene un **layout de header horizontal + grilla de proyectos**, pero el diseño aprobado propone un **layout con sidebar oscuro persistente, dashboard con saludo personalizado, activity feed de agentes, gate cards y suggestion chips en el chat**.

Necesito que implementes **5 bloques de cambios** para migrar el dashboard actual al diseño aprobado. Lee SIEMPRE el archivo antes de modificarlo. Usa los colores del design system (NO inventes colores). Usa Lucide React para iconos. Usa `font-display` para headings. Mantén dark mode support.

**Colores clave del design system:**
- Command Blue: `#0F2B46` (primary)
- Deep Navy: `#0A1F33` (dark surfaces)
- Squad Teal: `#0EA5A3` (acciones, CTAs, links)
- Signal Amber: `#F59E0B` (gates, alertas, upgrade)
- Tailwind tokens: `bg-brand-command-blue`, `bg-brand-squad-teal`, `bg-brand-signal-amber`, `bg-brand-deep-navy`
- Fase colors: `bg-phase-discovery` (#6366F1), `bg-phase-requirements` (#8B5CF6), etc.
- Agent colors: `bg-agent-cto` (#0EA5A3), `bg-agent-product` (#6366F1), etc.

**Stack:** Next.js App Router, TypeScript strict, Tailwind CSS v4, shadcn/ui, Lucide React, Supabase.

---

## BLOQUE 1: Migrar layout dashboard a sidebar persistente

**Archivo a modificar:** `src/app/(dashboard)/layout.tsx`

**Estado actual:** Header horizontal con logo + user menu + `<main>` con `max-w-7xl`.

**Cambio requerido:** Reemplazar con layout de 2 columnas: sidebar fijo a la izquierda + área de contenido a la derecha.

### Instrucciones precisas:

1. Lee `src/app/(dashboard)/layout.tsx` completo.

2. Reescribe el layout manteniendo TODA la lógica existente (auth check, profile fetch, redirect, FounderModeProvider, TrialBanner, UsageQuotaBanner) pero cambiando la estructura visual:

```tsx
// NUEVA ESTRUCTURA (pseudocódigo — adapta con las imports y lógica existente):
<div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0A1F33]">
  {/* Sidebar */}
  <aside className="flex w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#0A1F33] to-[#0F2B46]">
    {/* Logo section */}
    <div className="flex h-14 items-center gap-2 px-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0EA5A3] to-[#0EA5A3]/70 shadow-sm">
        <Zap className="h-4 w-4 text-white" />
      </div>
      <span className="font-display text-base font-bold text-white">AI Squad</span>
    </div>

    {/* Navigation links */}
    <nav className="flex-1 space-y-1 px-3 py-4">
      <SidebarLink href="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
      <SidebarLink href="/dashboard" icon={<FolderKanban />} label="Proyectos" />
      <SidebarLink href="/settings" icon={<Settings />} label="Configuración" />
    </nav>

    {/* User section at bottom */}
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0EA5A3] text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{displayName}</p>
          <p className="truncate text-xs text-white/50">{user.email}</p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white/70">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  </aside>

  {/* Main content */}
  <div className="flex flex-1 flex-col overflow-hidden">
    <main className="flex-1 overflow-y-auto px-8 py-6">
      <FounderModeProvider persona={profile.persona ?? null}>
        <UsageQuotaBanner />
        <TrialBanner ... />
        {children}
      </FounderModeProvider>
    </main>
  </div>
</div>
```

3. Crea un componente helper `SidebarLink` (puede estar inline en el mismo archivo o en `src/components/dashboard/SidebarLink.tsx`):

```tsx
function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  // Usa usePathname() del lado cliente si necesitas highlight activo
  // O mantenlo simple como server component con CSS hover
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
      <span className="h-5 w-5">{icon}</span>
      {label}
    </Link>
  )
}
```

4. **Imports necesarios:** Añade `import { Zap, LayoutDashboard, FolderKanban, Settings, LogOut } from 'lucide-react'`

5. **IMPORTANTE:** Como este layout es un Server Component, el `SidebarLink` con `usePathname()` necesitaría ser Client Component. Puedes resolverlo de dos formas:
   - Opción A: Hacer el SidebarLink un archivo separado con `'use client'` y `usePathname()` para highlight activo
   - Opción B: Pasar el pathname actual como prop desde el server component (no funciona directamente en layout)
   - **Recomendado:** Opción A — crea `src/components/dashboard/SidebarNav.tsx` como Client Component con toda la nav

---

## BLOQUE 2: Nuevo dashboard home con greeting, progress y activity

**Archivos a modificar:**
- `src/app/(dashboard)/dashboard/page.tsx` (o `src/app/(dashboard)/page.tsx` según routing)
- `src/components/dashboard/DashboardHeader.tsx`

**Archivos nuevos a crear:**
- `src/components/dashboard/DashboardGreeting.tsx`
- `src/components/dashboard/GlobalProgressBar.tsx`
- `src/components/dashboard/AgentActivityFeed.tsx`
- `src/components/dashboard/PendingGatesCard.tsx`

### 2.1 — DashboardGreeting.tsx

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

type Props = { displayName: string }

export function DashboardGreeting({ displayName }: Props) {
  const [greeting, setGreeting] = useState('Hola')

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Buenos días')
    else if (h < 18) setGreeting('Buenas tardes')
    else setGreeting('Buenas noches')
  }, [])

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#0EA5A3]" />
        <h1 className="font-display text-2xl font-bold text-[#0F2B46] dark:text-white">
          {greeting}, {displayName.split(' ')[0]}
        </h1>
      </div>
      <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
        Aquí tienes un resumen de tu progreso y actividad reciente.
      </p>
    </div>
  )
}
```

### 2.2 — GlobalProgressBar.tsx

```tsx
import type { ProjectWithProgress } from '@/types/project'
import { PHASE_NAMES } from '@/types/project'

type Props = { projects: ProjectWithProgress[] }

const PHASE_COLORS: Record<number, string> = {
  0: '#6366F1', 1: '#8B5CF6', 2: '#0EA5A3', 3: '#0EA5A3',
  4: '#10B981', 5: '#F59E0B', 6: '#F97316', 7: '#EF4444',
}

export function GlobalProgressBar({ projects }: Props) {
  // Aggregate: count phases completed across all projects
  const totalPhases = projects.length * 8
  const completedPhases = projects.reduce((sum, p) => sum + p.phases_completed, 0)
  const overallProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

  // Per-phase breakdown: how many projects have each phase completed
  const phaseBreakdown = Array.from({ length: 8 }, (_, i) => {
    const completed = projects.filter(p => {
      const phase = p.phases?.find(ph => ph.phase_number === i)
      return phase?.status === 'completed'
    }).length
    return { phase: i, completed, total: projects.length, color: PHASE_COLORS[i] }
  })

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-[#0F2B46] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-[#0F2B46] dark:text-white">Progreso Global</h3>
        <span className="rounded-full bg-[#E8F4F8] dark:bg-[#0EA5A3]/20 px-2.5 py-0.5 text-xs font-bold text-[#0F2B46] dark:text-[#0EA5A3]">
          {overallProgress}%
        </span>
      </div>

      {/* Segmented progress bar */}
      <div className="flex gap-1">
        {phaseBreakdown.map((pb) => (
          <div key={pb.phase} className="flex-1" title={`${PHASE_NAMES[pb.phase]}: ${pb.completed}/${pb.total}`}>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: pb.total > 0 ? `${(pb.completed / pb.total) * 100}%` : '0%',
                  backgroundColor: pb.color,
                }}
              />
            </div>
            <p className="mt-1 text-center text-[9px] text-gray-400 dark:text-gray-500">{String(pb.phase).padStart(2, '0')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2.3 — AgentActivityFeed.tsx

Este componente muestra las últimas conversaciones con agentes. Obtiene datos de `conversation_threads` via Supabase.

```tsx
import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Clock } from 'lucide-react'
import Link from 'next/link'

const AGENT_META: Record<string, { name: string; icon: string; color: string }> = {
  cto_virtual:       { name: 'CTO Virtual',       icon: '⚡', color: '#0EA5A3' },
  product_architect: { name: 'Product Architect',  icon: '📋', color: '#6366F1' },
  system_architect:  { name: 'System Architect',   icon: '🏗️', color: '#8B5CF6' },
  ui_ux_designer:    { name: 'UI/UX Designer',     icon: '🎨', color: '#EC4899' },
  lead_developer:    { name: 'Lead Developer',     icon: '💻', color: '#0EA5A3' },
  db_admin:          { name: 'DB Admin',           icon: '🗄️', color: '#F59E0B' },
  qa_engineer:       { name: 'QA Engineer',        icon: '🧪', color: '#10B981' },
  devops_engineer:   { name: 'DevOps Engineer',    icon: '🚀', color: '#F97316' },
}

export async function AgentActivityFeed() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get recent threads across all projects
  const { data: threads } = await supabase
    .from('conversation_threads')
    .select('id, project_id, agent_type, title, message_count, last_message_at, projects(name)')
    .eq('projects.user_id', user.id)
    .order('last_message_at', { ascending: false })
    .limit(5)

  if (!threads || threads.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-[#0F2B46] p-5">
        <h3 className="font-display text-sm font-semibold text-[#0F2B46] dark:text-white mb-3">Actividad de Agentes</h3>
        <p className="text-sm text-[#94A3B8]">Sin actividad reciente. Inicia una conversación con un agente.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-[#0F2B46] p-5">
      <h3 className="font-display text-sm font-semibold text-[#0F2B46] dark:text-white mb-3">Actividad Reciente</h3>
      <div className="space-y-3">
        {threads.map((thread) => {
          const agent = AGENT_META[thread.agent_type] ?? { name: thread.agent_type, icon: '🤖', color: '#6B7280' }
          const projectName = (thread as any).projects?.name ?? 'Proyecto'
          const timeAgo = getRelativeTime(thread.last_message_at)

          return (
            <Link
              key={thread.id}
              href={`/projects/${thread.project_id}/phase/00?thread=${thread.id}`}
              className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                style={{ backgroundColor: `${agent.color}18` }}
              >
                {agent.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#0F2B46] dark:text-white truncate">
                  {agent.name} <span className="font-normal text-[#94A3B8]">en</span> {projectName}
                </p>
                <p className="text-xs text-[#94A3B8] truncate">{thread.title ?? `${thread.message_count} mensajes`}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-[10px] text-[#94A3B8]">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMin = Math.round((now - then) / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.round(diffH / 24)
  return `${diffD}d`
}
```

**NOTA:** Si la tabla `conversation_threads` no tiene join directo con `projects`, ajusta la query. Revisa el schema en `infrastructure/supabase/migrations/` para confirmar las foreign keys antes de escribir la query.

### 2.4 — PendingGatesCard.tsx

```tsx
import { createClient } from '@/lib/supabase/server'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { PHASE_NAMES } from '@/types/project'

export async function PendingGatesCard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Find phases that are completed but not approved (pending gate)
  const { data: pendingGates } = await supabase
    .from('project_phases')
    .select('id, project_id, phase_number, status, projects(name)')
    .eq('status', 'completed')
    .is('approved_at', null)
    .limit(5)

  // If no gate concept in current schema, show phases that are active (awaiting user review)
  if (!pendingGates || pendingGates.length === 0) return null

  return (
    <div className="rounded-xl border-2 border-[#F59E0B]/30 bg-[#F59E0B]/5 dark:bg-[#F59E0B]/10 p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-[#F59E0B]" />
        <h3 className="font-display text-sm font-semibold text-[#0F2B46] dark:text-white">
          Pendiente tu aprobación
        </h3>
        <span className="rounded-full bg-[#F59E0B] px-2 py-0.5 text-[10px] font-bold text-white">
          {pendingGates.length}
        </span>
      </div>
      <div className="space-y-2">
        {pendingGates.map((gate) => {
          const phaseNum = String(gate.phase_number).padStart(2, '0')
          const projectName = (gate as any).projects?.name ?? 'Proyecto'
          return (
            <Link
              key={gate.id}
              href={`/projects/${gate.project_id}/phase/${phaseNum}`}
              className="flex items-center justify-between rounded-lg bg-white dark:bg-[#0F2B46] p-3 transition-colors hover:shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-[#0F2B46] dark:text-white">{projectName}</p>
                <p className="text-xs text-[#94A3B8]">Phase {phaseNum} — {PHASE_NAMES[gate.phase_number]}</p>
              </div>
              <span className="rounded-lg bg-[#F59E0B] px-3 py-1.5 text-xs font-semibold text-white">
                Revisar
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

### 2.5 — Modificar la página del dashboard

Lee `src/app/(dashboard)/dashboard/page.tsx` (o donde esté la página principal del dashboard).

Modifica para incluir los nuevos componentes **ANTES** del ProjectsGrid:

```tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getNextAction } from '@/lib/projects/get-next-action'
import { ProjectsGrid } from '@/components/dashboard/ProjectsGrid'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { GlobalProgressBar } from '@/components/dashboard/GlobalProgressBar'
import { AgentActivityFeed } from '@/components/dashboard/AgentActivityFeed'
import { PendingGatesCard } from '@/components/dashboard/PendingGatesCard'
import type { ProjectWithProgress } from '@/types/project'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const displayName = profile?.full_name || user!.email?.split('@')[0] || 'Usuario'

  // ... (mantener toda la lógica de fetch de projects y enriched existente)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <DashboardGreeting displayName={displayName} />

      {/* Top row: Progress + Pending Gates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlobalProgressBar projects={enriched} />
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />}>
          <PendingGatesCard />
        </Suspense>
      </div>

      {/* Activity feed */}
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />}>
        <AgentActivityFeed />
      </Suspense>

      {/* Projects grid (existing) */}
      <Suspense>
        <ProjectsGrid projects={enriched} />
      </Suspense>
    </div>
  )
}
```

---

## BLOQUE 3: Sidebar oscuro en PhasesStepper (dentro de proyecto)

**Archivo a modificar:** `src/components/projects/PhasesStepper.tsx`

### Instrucciones:

1. Lee `src/components/projects/PhasesStepper.tsx` completo.

2. Cambia el contenedor `<nav>` de:
```
className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
```
a:
```
className="rounded-xl bg-gradient-to-b from-[#0A1F33] to-[#0F2B46] p-4 shadow-sidebar"
```

3. Actualiza los colores internos para funcionar sobre fondo oscuro:

- Header "Fases del proyecto": cambiar `text-gray-400` → `text-white/50`
- Progress percentage badge: cambiar `bg-[#E8F4F8] text-[#0F2B46]` → `bg-white/10 text-[#0EA5A3]`
- Progress bar background: cambiar `bg-gray-100` → `bg-white/10`
- Contextual text "Ahora:": cambiar `bg-gray-50 text-gray-600` → `bg-white/5 text-white/70`
- "Ahora:" bold: cambiar `text-gray-700` → `text-white`

4. En `StepperItem`, actualizar:
- Active state: `bg-[#0EA5A3]/15` → `bg-[#0EA5A3]/20`
- Completed hover: `hover:bg-green-50/50` → `hover:bg-white/5`
- Active hover: `hover:bg-[#E8F4F8]/50` → `hover:bg-white/5`
- Vertical line default: `bg-gray-200` → `bg-white/10`
- Vertical line completed: `bg-green-300` → `bg-green-500/50`
- Locked number square: `bg-gray-200` → `bg-white/10`
- Locked text: `text-gray-400` → `text-white/30`
- Completed label: `text-gray-700` → `text-white/80`
- Active label (not current): `text-[#0F2B46]` → `text-white`
- Locked label: `text-gray-400` → `text-white/30`
- Phase subtitle "Phase XX": `text-gray-400` → `text-white/40`
- Completed subtitle: `text-green-600` → `text-green-400`
- Reset button: `text-gray-300 hover:bg-red-50` → `text-white/20 hover:bg-red-500/20`

5. Bottom links section:
- Divider: `border-gray-100` → `border-white/10`
- Active link bg: `bg-[#E8F4F8]` → `bg-[#0EA5A3]/15`
- Active text: `text-[#0F2B46]` → `text-[#0EA5A3]`
- Default text: `text-gray-700` → `text-white/70`
- Hover: `hover:bg-gray-50` → `hover:bg-white/5`

6. **Elimina** los sufijos `dark:` duplicados — ya no son necesarios porque el sidebar siempre es oscuro.

---

## BLOQUE 4: Colores por agente en AgentCard

**Archivo a modificar:** `src/components/agents/AgentCard.tsx`

### Instrucciones:

1. Lee `src/components/agents/AgentCard.tsx` completo.

2. El componente ya recibe `agentColor` como prop y ya lo usa para el background del avatar con `${agentColor}18`. Esto está bien.

3. **Añadir:** Borde lateral con color del agente cuando está activo. Cambiar el `isActive` styling de:
```
'border border-[#0EA5A3] bg-[#E8F4F8]'
```
a:
```tsx
// Usar el agentColor para el borde y el fondo
`border-l-4 bg-[${agentColor}]/5`
// O con style inline para dinamismo:
```

Dado que Tailwind no puede usar colores dinámicos en clases, usa style inline:

```tsx
style={isActive && agentColor ? {
  borderLeftWidth: '4px',
  borderLeftColor: agentColor,
  backgroundColor: `${agentColor}0D`, // 5% opacity
} : undefined}
```

4. **Verificar** que todos los componentes padres pasan `agentColor` al renderizar AgentCard. Busca en el codebase dónde se usa `<AgentCard` y confirma que se pasa la prop. Si no se pasa, añade un mapa:

```tsx
const AGENT_COLORS: Record<string, string> = {
  cto_virtual: '#0EA5A3',
  product_architect: '#6366F1',
  system_architect: '#8B5CF6',
  ui_ux_designer: '#EC4899',
  lead_developer: '#0EA5A3',
  db_admin: '#F59E0B',
  qa_engineer: '#10B981',
  devops_engineer: '#F97316',
}
```

---

## BLOQUE 5: Suggestion chips en el chat

**Archivo a modificar:** `src/components/shared/chat/ChatInput.tsx`

**Archivo nuevo (opcional):** `src/components/shared/chat/SuggestionChips.tsx`

### Instrucciones:

1. Lee `src/components/shared/chat/ChatInput.tsx` completo.

2. Crea un componente `SuggestionChips` que muestre 2-3 sugerencias proactivas encima del input del chat:

```tsx
'use client'

type Props = {
  suggestions: string[]
  onSelect: (text: string) => void
  visible: boolean // solo mostrar cuando el chat está vacío o al inicio
}

export function SuggestionChips({ suggestions, onSelect, visible }: Props) {
  if (!visible || suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {suggestions.map((text, i) => (
        <button
          key={i}
          onClick={() => onSelect(text)}
          className="rounded-full border border-[#0EA5A3]/30 bg-[#0EA5A3]/5 px-4 py-2 text-sm font-medium text-[#0EA5A3] transition-all hover:bg-[#0EA5A3]/10 hover:border-[#0EA5A3]/50 hover:shadow-sm dark:border-[#0EA5A3]/20 dark:bg-[#0EA5A3]/10 dark:text-[#0EA5A3] dark:hover:bg-[#0EA5A3]/20"
        >
          {text}
        </button>
      ))}
    </div>
  )
}
```

3. Integra las chips en el contenedor del chat (probablemente en el componente padre que renderiza ChatInput). Las sugerencias dependen del agente y la fase actual. Ejemplo:

```tsx
const AGENT_SUGGESTIONS: Record<string, string[]> = {
  cto_virtual: [
    '¿Cuál es el siguiente paso del proyecto?',
    'Revisa la arquitectura actual',
    'Prioriza el backlog',
  ],
  product_architect: [
    'Define los requisitos del MVP',
    'Genera el spec KIRO',
    'Valida las user stories',
  ],
  ui_ux_designer: [
    'Genera wireframes para el dashboard',
    'Propone un style guide',
    'Revisa el flujo de usuario',
  ],
  lead_developer: [
    'Implementa el siguiente task',
    'Revisa el código actual',
    'Optimiza el rendimiento',
  ],
  // ... agregar para cada agente
}
```

4. Las chips desaparecen cuando el usuario envía su primer mensaje en el thread (usar el estado de mensajes existente para determinar visibilidad).

---

## VERIFICACIÓN FINAL

Después de implementar los 5 bloques:

1. Ejecuta `pnpm build` — debe compilar sin errores
2. Ejecuta `pnpm lint` — corrige cualquier warning
3. Verifica visualmente en `localhost:3000/dashboard`:
   - Sidebar oscuro con gradiente visible a la izquierda
   - Saludo personalizado con hora del día
   - Barra de progreso global segmentada por fase
   - Card amber de gates pendientes (si hay datos)
   - Feed de actividad de agentes (si hay threads)
   - Grilla de proyectos existente funcional
4. Verifica en `/projects/[id]/phase/00`:
   - PhasesStepper con fondo oscuro
   - Colores de agentes correctos en AgentCard
   - Suggestion chips visibles en chat vacío
5. Verifica responsive: el sidebar debería colapsar en móvil (puedes añadir un toggle hamburger como mejora posterior)

---

## NOTAS IMPORTANTES

- **NO modifiques** `src/app/globals.css` — los tokens ya están configurados correctamente
- **NO instales** nuevas dependencias — todo lo necesario ya está en el proyecto
- **USA** Lucide React (`lucide-react`) para todos los iconos nuevos, NO inline SVGs
- **USA** `font-display` (DM Sans) para todos los headings h1-h3
- **MANTÉN** la lógica de auth/redirect/profile intacta en el layout
- **PRESERVA** dark mode support en todos los componentes
- **REVISA** el schema de Supabase antes de escribir queries en AgentActivityFeed y PendingGatesCard (las tablas pueden tener nombres o relaciones diferentes)
- Si una tabla o columna no existe para algún componente (como `approved_at` en `project_phases`), crea el componente con datos mock/placeholder y deja un TODO comment
