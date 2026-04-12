'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  LogOut,
} from 'lucide-react'
import { TribuxLogo } from '@/components/ui/TribuxLogo'
import { SidebarUsageWidget } from './SidebarUsageWidget'

function NavLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  const pathname = usePathname()
  const active =
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/dashboard/'
      : pathname === href || pathname?.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-white/15 text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      {label}
    </Link>
  )
}

type SidebarNavProps = {
  displayName: string
  email: string | undefined
  initials: string
}

export function SidebarNav({ displayName, email, initials }: SidebarNavProps) {
  return (
    <aside className="flex h-14 w-full shrink-0 flex-col border-b border-white/10 bg-gradient-to-b from-[#0A1F33] to-[#0F2B46] md:h-screen md:w-64 md:border-b-0 md:border-r md:border-white/10 md:shadow-[var(--shadow-sidebar)]">
      <div className="flex h-14 items-center gap-2 px-5">
        <TribuxLogo size={32} />
        <span className="font-display text-base font-bold text-white">Tribux</span>
      </div>

      <nav className="flex min-h-0 flex-1 flex-row gap-1 overflow-x-auto px-3 py-3 md:flex-col md:space-y-1 md:overflow-y-auto md:py-4">
        <NavLink href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" />
        <NavLink href="/dashboard" icon={<FolderKanban className="h-5 w-5" />} label="Proyectos" />
        <NavLink href="/settings" icon={<Settings className="h-5 w-5" />} label="Configuración" />
      </nav>

      <div className="flex border-t border-white/10 p-3 md:hidden">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0EA5A3] text-[10px] font-bold text-white">
              {initials}
            </div>
            <span className="truncate text-xs text-white/80">{displayName}</span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="hidden md:block">
        <SidebarUsageWidget />
      </div>

      <div className="hidden border-t border-white/10 p-4 md:block">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0EA5A3] text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="truncate text-xs text-white/50">{email ?? ''}</p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
